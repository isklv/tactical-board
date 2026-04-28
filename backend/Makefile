.PHONY: setup run test build clean

setup:
	go mod download

run:
	go run main.go

test:
	go test -v ./...

build:
	go build -o board-server main.go

clean:
	rm -f board-server board.db

migrate:
	go run main.go