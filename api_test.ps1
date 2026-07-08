# Bhagya Live API Test Suite
# Run: .\api_test.ps1

$BASE = "https://thebhagya-backend-production.up.railway.app"
$TS   = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$EMAIL = "apitest_$TS@bhagya.test"
$PASS  = "Test@1234"
$TOKEN = ""
$CHART_ID = ""
$PASS_COUNT = 0
$FAIL_COUNT = 0

function Pass($label) {
    Write-Host "  [PASS] $label" -ForegroundColor Green
    $script:PASS_COUNT++
}
function Fail($label, $detail="") {
    Write-Host "  [FAIL] $label" -ForegroundColor Red
    if ($detail) { Write-Host "         $detail" -ForegroundColor DarkRed }
    $script:FAIL_COUNT++
}
function Section($title) {
    Write-Host ""
    Write-Host "--- $title ---" -ForegroundColor Cyan
}
function Post($path, $body, $tok="") {
    $headers = @{ "Content-Type" = "application/json" }
    if ($tok) { $headers["Authorization"] = "Bearer $tok" }
    try {
        $r = Invoke-RestMethod -Uri "$BASE$path" -Method POST -Headers $headers `
             -Body ($body | ConvertTo-Json) -ErrorAction Stop
        return @{ ok=$true; data=$r }
    } catch {
        $code = 0
        $msg  = ""
        try { $code = $_.Exception.Response.StatusCode.value__ } catch {}
        try { $msg = ($_.ErrorDetails.Message | ConvertFrom-Json).detail } catch { $msg = $_.Exception.Message }
        return @{ ok=$false; status=$code; error=$msg }
    }
}
function Get($path, $tok="") {
    $headers = @{}
    if ($tok) { $headers["Authorization"] = "Bearer $tok" }
    try {
        $r = Invoke-RestMethod -Uri "$BASE$path" -Method GET -Headers $headers -ErrorAction Stop
        return @{ ok=$true; data=$r }
    } catch {
        $code = 0
        $msg  = ""
        try { $code = $_.Exception.Response.StatusCode.value__ } catch {}
        try { $msg = ($_.ErrorDetails.Message | ConvertFrom-Json).detail } catch { $msg = $_.Exception.Message }
        return @{ ok=$false; status=$code; error=$msg }
    }
}

Write-Host "Bhagya Live API Test Suite" -ForegroundColor Yellow
Write-Host "Backend : $BASE"
Write-Host "Email   : $EMAIL"

# 1. HEALTH
Section "1. Health"
$r = Get "/health"
if ($r.ok -and $r.data.status -eq "ok") { Pass "GET /health -> ok" }
else { Fail "GET /health" $r.error }

# 2. REGISTER
Section "2. Auth - Register"
$r = Post "/v1/auth/register" @{ email=$EMAIL; password=$PASS; plan="starter" }
if ($r.ok -and $r.data.token) {
    $TOKEN = $r.data.token
    Pass "POST /v1/auth/register -> token OK, plan=$($r.data.user.plan)"
} else { Fail "POST /v1/auth/register" "$($r.status): $($r.error)" }

# 3. LOGIN
Section "3. Auth - Login"
$r = Post "/v1/auth/login" @{ email=$EMAIL; password=$PASS }
if ($r.ok -and $r.data.token) {
    $TOKEN = $r.data.token
    Pass "POST /v1/auth/login -> token OK"
} else { Fail "POST /v1/auth/login" "$($r.status): $($r.error)" }

# 4. /ME
Section "4. Auth - /me"
$r = Get "/v1/auth/me?token=$TOKEN"
if ($r.ok -and $r.data.email -eq $EMAIL) { Pass "GET /v1/auth/me -> email matches" }
else { Fail "GET /v1/auth/me" "$($r.status): $($r.error)" }

# 5. OTP SEND - validates Supabase RLS fix
Section "5. OTP Send (validates Supabase RLS)"
$r = Post "/v1/auth/otp/send" @{ email=$EMAIL }
if ($r.ok) { Pass "POST /v1/auth/otp/send -> $($r.data.message)" }
else { Fail "POST /v1/auth/otp/send" "$($r.status): $($r.error)" }

# 6. OTP VERIFY wrong code - expect 401
Section "6. OTP Verify wrong code (expect 401)"
$r = Post "/v1/auth/otp/verify" @{ email=$EMAIL; otp="000000" }
if (-not $r.ok -and $r.status -eq 401) { Pass "Wrong OTP -> 401 as expected" }
else { Fail "Wrong OTP guard" "Expected 401, got status=$($r.status)" }

# 7. CREATE CHART
Section "7. Charts - Create"
$chartBody = @{
    label      = "API Test Chart"
    dob        = "1992-05-20"
    tob        = "17:13"
    timezone   = "Asia/Kolkata"
    lat        = 26.4499
    lon        = 80.3319
    place_name = "Kanpur, India"
}
$r = Post "/v1/charts" $chartBody $TOKEN
if ($r.ok -and $r.data.id) {
    $CHART_ID = $r.data.id
    Pass "POST /v1/charts -> id=$($r.data.id.Substring(0,8))..."
} else { Fail "POST /v1/charts" "$($r.status): $($r.error)" }

# 8. GET CHART
Section "8. Charts - Get by ID"
if ($CHART_ID) {
    $r = Get "/v1/charts/$CHART_ID" $TOKEN
    if ($r.ok -and $r.data.lagna) { Pass "GET /v1/charts/:id -> lagna=$($r.data.lagna.sign)" }
    else { Fail "GET /v1/charts/:id" "$($r.status): $($r.error)" }
} else { Fail "GET /v1/charts/:id" "Skipped - no chart_id from step 7" }

# 9. LIST CHARTS
Section "9. Charts - List"
$r = Get "/v1/charts" $TOKEN
if ($r.ok) { Pass "GET /v1/charts -> $($r.data.Count) chart(s) returned" }
else { Fail "GET /v1/charts" "$($r.status): $($r.error)" }

# 10. WRONG PASSWORD
Section "10. Auth - Wrong password (expect 401)"
$r = Post "/v1/auth/login" @{ email=$EMAIL; password="WrongPass" }
if (-not $r.ok -and $r.status -eq 401) { Pass "Wrong password -> 401 as expected" }
else { Fail "Wrong password guard" "Expected 401, got status=$($r.status)" }

# 11. NUMEROLOGY
Section "11. Numerology"
$r = Post "/v1/numerology" @{ full_name="Rakshit Saluja"; dob="1992-05-20" } $TOKEN
if ($r.ok) { Pass "POST /v1/numerology -> life_path=$($r.data.life_path)" }
else { Fail "POST /v1/numerology" "$($r.status): $($r.error)" }

# 12. PAYMENT PLANS
Section "12. Payments - Plans"
$r = Get "/v1/payments/plans"
if ($r.ok) { Pass "GET /v1/payments/plans -> OK" }
else { Fail "GET /v1/payments/plans" "$($r.status): $($r.error)" }

# SUMMARY
Write-Host ""
Write-Host "================================" -ForegroundColor Yellow
Write-Host "  PASSED : $PASS_COUNT" -ForegroundColor Green
Write-Host "  FAILED : $FAIL_COUNT" -ForegroundColor $(if ($FAIL_COUNT -eq 0) { "Green" } else { "Red" })
Write-Host "================================" -ForegroundColor Yellow
