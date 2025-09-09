package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"

	"nunoo.co/backend/api"
	"nunoo.co/backend/config"
)

func main() {
	// Enhanced logging configuration for production
	logConfig := zap.NewProductionConfig()
	logConfig.OutputPaths = []string{"stdout"}
	logConfig.ErrorOutputPaths = []string{"stderr"}
	logConfig.DisableStacktrace = false
	logConfig.Level = zap.NewAtomicLevelAt(zap.InfoLevel)

	logger, err := logConfig.Build(zap.AddCaller(), zap.AddCallerSkip(1))
	if err != nil {
		panic(err)
	}
	defer logger.Sync()

	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("failed to load config", zap.Error(err))
	}

	port := cfg.Server.Port
	if port == "" {
		port = "8080"
	}

	h := api.NewServer(cfg)

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           h,
		ReadTimeout:       durationOrDefault(cfg.Server.ReadTimeout, 10*time.Second),  // Shorter for better resource usage
		WriteTimeout:      durationOrDefault(cfg.Server.WriteTimeout, 10*time.Second), // Shorter for better resource usage
		IdleTimeout:       durationOrDefault(cfg.Server.IdleTimeout, 120*time.Second), // Longer for HTTP/2 efficiency
		ReadHeaderTimeout: 5 * time.Second,                                            // Added protection against slow loris attacks
		MaxHeaderBytes:    1 << 20,                                                    // 1MB header limit
	}

	serverCtx, serverStopCtx := context.WithCancel(context.Background())

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	go func() {
		<-sig

		shutdownCtx, shutdownCancel := context.WithTimeout(serverCtx, 30*time.Second)
		defer shutdownCancel()
		go func() {
			<-shutdownCtx.Done()
			if shutdownCtx.Err() == context.DeadlineExceeded {
				logger.Fatal("graceful shutdown timed out.. forcing exit.")
			}
		}()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			logger.Fatal("server shutdown error", zap.Error(err))
		}
		serverStopCtx()
	}()

	logger.Info("starting server", zap.String("port", port))
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatal("server error", zap.Error(err))
	}

	<-serverCtx.Done()
}

func durationOrDefault(v, def time.Duration) time.Duration {
	if v <= 0 {
		return def
	}
	return v
}
