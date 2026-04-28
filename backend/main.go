package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Models
type Board struct {
	ID           string        `gorm:"primaryKey" json:"id"`
	Token        string        `gorm:"uniqueIndex" json:"token"`
	Sport        string        `json:"sport"` // football, hockey, basketball
	Title        string        `json:"title"`
	Combinations []Combination `gorm:"foreignKey:BoardID" json:"combinations"`
}

type Combination struct {
	ID        string `gorm:"primaryKey" json:"id"`
	BoardID   string `json:"board_id"`
	Title     string `json:"title"`
	Content   string `json:"content"` // JSON with player positions and arrows
	Thumbnail string `json:"thumbnail,omitempty"` // Data URL or S3 key
}

// Canvas element types
type Player struct {
	X, Y       float64 `json:"x,y"`
	Number     int     `json:"number"`
	Color      string  `json:"color"` // team color
	Label      string  `json:"label,omitempty"` // player name
}

type Arrow struct {
	Points []struct {
		X, Y float64 `json:"x,y"`
	} `json:"points"`
	Color string `json:"color,omitempty"`
	Width int    `json:"width,omitempty"`
	Type  string `json:"type,omitempty"` // "pass", "movement", "shoot"
}

type CanvasContent struct {
	Players []Player `json:"players"`
	Arrows  []Arrow  `json:"arrows"`
}

var db *gorm.DB

func main() {
	// Init DB
	var err error
	db, err = gorm.Open(sqlite.Open("board.db"), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}
	db.AutoMigrate(&Board{}, &Combination{})

	// Routes
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	
	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://example.com", "http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodDelete, http.MethodPut, http.MethodPatch},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route("/api/v1", func(r chi.Router) {
		// Health
		r.Get("/health", healthHandler)

		// Boards
		r.Post("/boards", createBoard)
		r.Get("/boards", listBoards)
		r.Get("/boards/{token}", getBoard)
		r.Delete("/boards/{token}", deleteBoard)

		// Combinations
		r.Post("/boards/{token}/combos", createCombination)
		r.Get("/boards/{token}/combos", listCombinations)
		r.Delete("/boards/{token}/combos/{comboId}", deleteCombination)
		r.Put("/boards/{token}/combos/{comboId}", updateCombination)

		// Canvas rendering (export to image)
		r.Post("/render/canvas", renderCanvas)
	})

	log.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(`{"status":"ok"}`))
}

func createBoard(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Sport string `json:"sport"`
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	board := Board{
		ID:    uuid.New().String(),
		Token: uuid.New().String(),
		Sport: input.Sport,
		Title: input.Title,
	}
	db.Create(&board)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(board)
}

func listBoards(w http.ResponseWriter, r *http.Request) {
	var boards []Board
	db.Find(&boards)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(boards)
}

func getBoard(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	var board Board
	if err := db.Preload("Combinations").First(&board, "token = ?", token).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Board not found"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(board)
}

func deleteBoard(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	db.Delete(&Board{}, "token = ?", token)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "deleted"})
}

func createCombination(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	var combo Combination
	if err := json.NewDecoder(r.Body).Decode(&combo); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}
	combo.ID = uuid.New().String()
	combo.BoardID = token
	db.Create(&combo)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(combo)
}

func listCombinations(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	var combos []Combination
	db.Where("board_id = ?", token).Find(&combos)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(combos)
}

func deleteCombination(w http.ResponseWriter, r *http.Request) {
	comboId := chi.URLParam(r, "comboId")
	db.Delete(&Combination{}, "id = ?", comboId)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "deleted"})
}

func updateCombination(w http.ResponseWriter, r *http.Request) {
	comboId := chi.URLParam(r, "comboId")
	var combo Combination
	if err := json.NewDecoder(r.Body).Decode(&combo); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}
	combo.ID = comboId
	db.Save(&combo)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(combo)
}

// renderCanvas renders a tactical diagram from canvas data and returns a PNG image
func renderCanvas(w http.ResponseWriter, r *http.Request) {
	var content CanvasContent
	if err := json.NewDecoder(r.Body).Decode(&content); err != nil {
		http.Error(w, `{"error":"invalid json"}`, http.StatusBadRequest)
		return
	}

	// For now, return a placeholder response
	// TODO: Implement proper canvas rendering with freetype or similar
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
		"message": "Canvas rendering endpoint (placeholder)",
		"playerCount": fmt.Sprintf("%d", len(content.Players)),
		"arrowCount":  fmt.Sprintf("%d", len(content.Arrows)),
	})
}

func init() {
	fmt.Println("Board backend initialized with Chi")
}
