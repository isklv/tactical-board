package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Models
type Board struct {
	ID          string        `gorm:"primaryKey" json:"id"`
	Token       string        `gorm:"uniqueIndex" json:"token"`
	Sport       string        `json:"sport"` // football, hockey, basketball
	Title       string        `json:"title"`
	Combinations []Combination `gorm:"foreignKey:BoardID" json:"combinations"`
}

type Combination struct {
	ID        string `gorm:"primaryKey" json:"id"`
	BoardID   string `json:"board_id"`
	Title     string `json:"title"`
	Content   string `json:"content"` // JSON with player positions and arrows
	Thumbnail string `json:"thumbnail,omitempty"` // Data URL or S3 key
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
	r := gin.Default()
	r.GET("/health", healthHandler)
	
	// Boards
	r.POST("/api/v1/boards", createBoard)
	r.GET("/api/v1/boards/:token", getBoard)
	r.DELETE("/api/v1/boards/:token", deleteBoard)
	
	// Combinations
	r.POST("/api/v1/boards/:token/combos", createCombination)
	r.GET("/api/v1/boards/:token/combos", listCombinations)
	r.DELETE("/api/v1/boards/:token/combos/:comboId", deleteCombination)

	log.Println("Server running on :8080")
	r.Run(":8080")
}

func healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func createBoard(c *gin.Context) {
	board := Board{
		ID:    uuid.New().String(),
		Token: uuid.New().String(),
	}
	db.Create(&board)
	c.JSON(http.StatusCreated, board)
}

func getBoard(c *gin.Context) {
	token := c.Param("token")
	var board Board
	if err := db.Preload("Combinations").First(&board, "token = ?", token).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Board not found"})
		return
	}
	c.JSON(http.StatusOK, board)
}

func deleteBoard(c *gin.Context) {
	token := c.Param("token")
	db.Delete(&Board{}, "token = ?", token)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func createCombination(c *gin.Context) {
	token := c.Param("token")
	var combo Combination
	if err := c.ShouldBindJSON(&combo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	combo.ID = uuid.New().String()
	combo.BoardID = token
	db.Create(&combo)
	c.JSON(http.StatusCreated, combo)
}

func listCombinations(c *gin.Context) {
	token := c.Param("token")
	var combos []Combination
	db.Where("board_id = ?", token).Find(&combos)
	c.JSON(http.StatusOK, combos)
}

func deleteCombination(c *gin.Context) {
	comboId := c.Param("comboId")
	db.Delete(&Combination{}, "id = ?", comboId)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func init() {
	fmt.Println("Board backend initialized")
}
