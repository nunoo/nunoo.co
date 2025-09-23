package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"os"

	"golang.org/x/crypto/argon2"
)

func main() {
	if len(os.Args) != 3 {
		log.Fatal("Usage: go run create_user.go <email> <password>")
	}

	email := os.Args[1]
	password := os.Args[2]

	// Generate user ID
	userID := generateUserID()

	// Hash password using same method as backend
	passwordHash, err := hashPassword(password)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// Output SQL command
	fmt.Printf("-- Add user: %s\n", email)
	fmt.Printf("INSERT INTO users (id, email, password_hash, created_at) VALUES ('%s', '%s', '%s', NOW());\n",
		userID, email, passwordHash)

	fmt.Printf("\n-- Or connect to your database and run:\n")
	fmt.Printf("psql -h localhost -U postgres -d nunoo -c \"INSERT INTO users (id, email, password_hash, created_at) VALUES ('%s', '%s', '%s', NOW());\"\n",
		userID, email, passwordHash)
}

func generateUserID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		log.Fatalf("Failed to generate random bytes: %v", err)
	}
	return "usr_" + base64.RawURLEncoding.EncodeToString(b)
}

func hashPassword(pw string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	// Same parameters as backend
	const (
		memory      = 128 * 1024 // 128MB
		iterations  = 3
		parallelism = 4
		keyLen      = 32
	)

	h := argon2.IDKey([]byte(pw), salt, iterations, memory, parallelism, keyLen)
	return fmt.Sprintf("argon2id$v=19$m=%d,t=%d,p=%d$%s$%s", memory, iterations, parallelism,
		base64.RawURLEncoding.EncodeToString(salt), base64.RawURLEncoding.EncodeToString(h)), nil
}