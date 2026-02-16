package utils

import (
	"regexp"
	"strings"
)

func ValidateEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

func ValidatePhone(phone string) bool {
	// Indian phone number format: 10 digits
	phoneRegex := regexp.MustCompile(`^[6-9]\d{9}$`)
	return phoneRegex.MatchString(phone)
}

func ValidatePassword(password string) bool {
	// At least 6 characters
	return len(password) >= 6
}

func SanitizeString(s string) string {
	return strings.TrimSpace(s)
}

func IsValidUserType(userType string) bool {
	return userType == "farmer" || userType == "buyer"
}
