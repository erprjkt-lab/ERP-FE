Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path "$scriptDir\.."
$logoPath = Join-Path $rootDir "public\logo.png"

if (-not (Test-Path $logoPath)) {
    Write-Error "Logo file not found at $logoPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($logoPath)
$srcW = $srcImg.Width
$srcH = $srcImg.Height
$srcAspect = $srcW / $srcH

function Generate-Icon {
    param(
        [int]$size,
        [string]$outPath,
        [float]$paddingRatio = 0.12,
        [float]$cornerRadiusRatio = 0.22
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $g.Clear([System.Drawing.Color]::Transparent)

    # Draw rounded white rectangle background
    $radius = [Math]::Max(2.0, [float]$size * $cornerRadiusRatio)
    $diameter = $radius * 2.0
    $rect = New-Object System.Drawing.RectangleF(0.0, 0.0, [float]$size, [float]$size)

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()

    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillPath($brush, $path)
    $brush.Dispose()
    $path.Dispose()

    # Calculate logo dimensions with padding
    $availW = [float]$size * (1.0 - 2.0 * $paddingRatio)
    $availH = [float]$size * (1.0 - 2.0 * $paddingRatio)

    if ($availW / $availH -gt $srcAspect) {
        $destH = $availH
        $destW = $destH * $srcAspect
    } else {
        $destW = $availW
        $destH = $destW / $srcAspect
    }

    $destX = ([float]$size - $destW) / 2.0
    $destY = ([float]$size - $destH) / 2.0

    $destRect = New-Object System.Drawing.RectangleF($destX, $destY, $destW, $destH)
    $g.DrawImage($srcImg, $destRect)

    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Write-Host "Generated $outPath ($size x $size)"
}

$publicDir = Join-Path $rootDir "public"
Generate-Icon -size 16  -outPath (Join-Path $publicDir "favicon-16x16.png")
Generate-Icon -size 32  -outPath (Join-Path $publicDir "favicon-32x32.png")
Generate-Icon -size 48  -outPath (Join-Path $publicDir "favicon-48x48.png")
Generate-Icon -size 96  -outPath (Join-Path $publicDir "favicon-96x96.png")
Generate-Icon -size 180 -outPath (Join-Path $publicDir "apple-touch-icon.png")
Generate-Icon -size 192 -outPath (Join-Path $publicDir "favicon-192x192.png")
Generate-Icon -size 512 -outPath (Join-Path $publicDir "favicon-512x512.png")

$srcImg.Dispose()
Write-Host "All PNG icons successfully generated."
