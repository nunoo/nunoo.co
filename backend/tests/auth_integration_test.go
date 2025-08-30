package api_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"nunoo.co/backend/config"
	"nunoo.co/backend/api"
)

type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type tokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

type userEnvelope struct {
	User struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	} `json:"user"`
}

func newTestServer(t *testing.T) http.Handler {
	t.Helper()
	// Ensure deterministic secrets for tests
	_ = os.Setenv("JWT_SECRET", "test-secret-access")
	_ = os.Setenv("JWT_REFRESH_SECRET", "test-secret-refresh")
	_ = os.Setenv("JWT_TOKENEXPIRY", "15m")
	_ = os.Setenv("JWT_REFRESHEXPIRY", "72h")

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("failed to load config: %v", err)
	}

	// For TDD, expect api.NewServerForTesting to exist and return an http.Handler
	return api.NewServerForTesting(cfg)
}

func doJSON(t *testing.T, h http.Handler, method, path string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		enc := json.NewEncoder(&buf)
		if err := enc.Encode(body); err != nil {
			t.Fatalf("failed to encode body: %v", err)
		}
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func authHeader(token string) http.Header {
	h := http.Header{}
	h.Set("Authorization", "Bearer "+token)
	return h
}

func doWithHeaders(t *testing.T, h http.Handler, method, path string, headers http.Header) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, nil)
	for k, v := range headers {
		for _, vv := range v {
			req.Header.Add(k, vv)
		}
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestAuth_EndToEnd_Register_Login_Me_Refresh(t *testing.T) {
	srv := newTestServer(t)

	email := "user@example.com"
	password := "Str0ngP@ssw0rd!"

	// Register
	rr := doJSON(t, srv, http.MethodPost, "/auth/register", registerRequest{Email: email, Password: password})
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d: %s", rr.Code, rr.Body.String())
	}
	var reg userEnvelope
	if err := json.Unmarshal(rr.Body.Bytes(), &reg); err != nil {
		t.Fatalf("invalid register response json: %v", err)
	}
	if reg.User.ID == "" || reg.User.Email != email {
		t.Fatalf("unexpected user in response: %+v", reg)
	}

	// Login
	lr := doJSON(t, srv, http.MethodPost, "/auth/login", registerRequest{Email: email, Password: password})
	if lr.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for login, got %d: %s", lr.Code, lr.Body.String())
	}
	var tok tokenResponse
	if err := json.Unmarshal(lr.Body.Bytes(), &tok); err != nil {
		t.Fatalf("invalid login response json: %v", err)
	}
	if tok.TokenType != "Bearer" || tok.AccessToken == "" || tok.RefreshToken == "" || tok.ExpiresIn <= 0 {
		t.Fatalf("unexpected token payload: %+v", tok)
	}

	// Me (protected)
	mr := doWithHeaders(t, srv, http.MethodGet, "/me", authHeader(tok.AccessToken))
	if mr.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for /me, got %d: %s", mr.Code, mr.Body.String())
	}
	var me userEnvelope
	if err := json.Unmarshal(mr.Body.Bytes(), &me); err != nil {
		t.Fatalf("invalid me response json: %v", err)
	}
	if me.User.Email != email || me.User.ID == "" {
		t.Fatalf("unexpected me payload: %+v", me)
	}

	// Refresh
	rfr := doJSON(t, srv, http.MethodPost, "/auth/refresh", map[string]string{"refresh_token": tok.RefreshToken})
	if rfr.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for refresh, got %d: %s", rfr.Code, rfr.Body.String())
	}
	var tok2 tokenResponse
	if err := json.Unmarshal(rfr.Body.Bytes(), &tok2); err != nil {
		t.Fatalf("invalid refresh response json: %v", err)
	}
	if tok2.AccessToken == tok.AccessToken {
		t.Fatalf("expected new access token to differ after refresh")
	}
}

func TestAuth_DuplicateEmailRegistration(t *testing.T) {
	srv := newTestServer(t)
	email := "dupe@example.com"
	password := "GoodPassw0rd!"

	r1 := doJSON(t, srv, http.MethodPost, "/auth/register", registerRequest{Email: email, Password: password})
	if r1.Code != http.StatusCreated {
		t.Fatalf("first register expected 201, got %d: %s", r1.Code, r1.Body.String())
	}
	r2 := doJSON(t, srv, http.MethodPost, "/auth/register", registerRequest{Email: email, Password: password})
	if r2.Code != http.StatusConflict {
		t.Fatalf("duplicate register expected 409, got %d: %s", r2.Code, r2.Body.String())
	}
}

func TestAuth_InvalidLoginAndProtection(t *testing.T) {
	srv := newTestServer(t)
	email := "login@example.com"
	password := "S0lidPass!"
	_ = doJSON(t, srv, http.MethodPost, "/auth/register", registerRequest{Email: email, Password: password})

	// Wrong password
	lr := doJSON(t, srv, http.MethodPost, "/auth/login", registerRequest{Email: email, Password: "wrong"})
	if lr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for bad credentials, got %d: %s", lr.Code, lr.Body.String())
	}

	// Missing token
	mr := doWithHeaders(t, srv, http.MethodGet, "/me", http.Header{})
	if mr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for missing token, got %d: %s", mr.Code, mr.Body.String())
	}

	// Malformed token
	ml := doWithHeaders(t, srv, http.MethodGet, "/me", authHeader("not-a-jwt"))
	if ml.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for malformed token, got %d: %s", ml.Code, ml.Body.String())
	}
}

func TestAuth_Validation(t *testing.T) {
	srv := newTestServer(t)

	cases := []registerRequest{
		{Email: "bad", Password: "short"},
		{Email: "", Password: "whatever"},
		{Email: "valid@example.com", Password: "short"},
	}
	for i, c := range cases {
		r := doJSON(t, srv, http.MethodPost, "/auth/register", c)
		if r.Code != http.StatusBadRequest {
			t.Fatalf("case %d expected 400, got %d: %s", i, r.Code, r.Body.String())
		}
	}
}
