package service

import (
	"fmt"

	"github.com/f2b-portal/backend/internal/models"
	"github.com/f2b-portal/backend/pkg/config"
	"gopkg.in/gomail.v2"
)

type EmailService struct {
	smtpHost string
	smtpPort string
	smtpUser string
	smtpPass string
}

func NewEmailService() *EmailService {
	return &EmailService{
		smtpHost: config.AppConfig.SMTPHost,
		smtpPort: config.AppConfig.SMTPPort,
		smtpUser: config.AppConfig.SMTPUser,
		smtpPass: config.AppConfig.SMTPPass,
	}
}

func (s *EmailService) sendEmail(to, subject, body string) error {
	if s.smtpUser == "" || s.smtpPass == "" {
		// Email not configured, skip silently
		return nil
	}

	m := gomail.NewMessage()
	m.SetHeader("From", s.smtpUser)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	port := 587
	if s.smtpPort != "" {
		fmt.Sscanf(s.smtpPort, "%d", &port)
	}

	d := gomail.NewDialer(s.smtpHost, port, s.smtpUser, s.smtpPass)

	return d.DialAndSend(m)
}

func (s *EmailService) SendWelcomeEmail(to, name string) error {
	subject := "Welcome to F2B Portal!"
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>Welcome to F2B Portal, %s!</h2>
			<p>Thank you for joining our farmer-to-buyer marketplace.</p>
			<p>You can now start listing your products or browsing available produce.</p>
			<br>
			<p>Happy trading!</p>
		</body>
		</html>
	`, name)

	return s.sendEmail(to, subject, body)
}

func (s *EmailService) SendOrderNotification(to string, order *models.Order) error {
	subject := "New Order Received!"
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>New Order Received!</h2>
			<p>You have received a new order for your product.</p>
			<p><strong>Order ID:</strong> %d</p>
			<p><strong>Product:</strong> %s</p>
			<p><strong>Quantity:</strong> %.2f</p>
			<p><strong>Total Price:</strong> ₹%.2f</p>
			<br>
			<p>Please confirm the order in your dashboard.</p>
		</body>
		</html>
	`, order.ID, order.Product.CropName, order.Quantity, order.TotalPrice)

	return s.sendEmail(to, subject, body)
}

func (s *EmailService) SendStatusUpdate(to string, order *models.Order, newStatus string) error {
	subject := fmt.Sprintf("Order #%d Status Updated", order.ID)
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>Order Status Updated</h2>
			<p>Your order status has been updated to: <strong>%s</strong></p>
			<p><strong>Order ID:</strong> %d</p>
			<p><strong>Product:</strong> %s</p>
			<p><strong>Quantity:</strong> %.2f</p>
			<p><strong>Total Price:</strong> ₹%.2f</p>
		</body>
		</html>
	`, newStatus, order.ID, order.Product.CropName, order.Quantity, order.TotalPrice)

	return s.sendEmail(to, subject, body)
}

func (s *EmailService) SendReviewReminder(to string, order *models.Order) error {
	subject := "Please Review Your Order"
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>How was your order?</h2>
			<p>Your order #%d has been completed.</p>
			<p>Please take a moment to review your experience with the farmer.</p>
			<br>
			<p>Thank you for using F2B Portal!</p>
		</body>
		</html>
	`, order.ID)

	return s.sendEmail(to, subject, body)
}
