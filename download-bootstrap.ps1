$bootstrapCssUrl = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
$bootstrapJsUrl = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"

$cssPath = "app/pages/vendor/bootstrap/css/bootstrap.min.css"
$jsPath = "app/pages/vendor/bootstrap/js/bootstrap.bundle.min.js"

Invoke-WebRequest -Uri $bootstrapCssUrl -OutFile $cssPath
Invoke-WebRequest -Uri $bootstrapJsUrl -OutFile $jsPath
