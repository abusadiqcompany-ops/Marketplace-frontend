$max=20
for ($i=0; $i -lt $max; $i++) {
  Write-Host "Attempt $($i+1) of $max"
  $resp = curl.exe -I -L 'https://marketplace-frontend-mu-two.vercel.app/src/main.tsx' 2>$null
  $line = ($resp | Select-String -Pattern 'Content-Type').ToString().Trim()
  if (-not $line) { Write-Host 'src/main.tsx -> (no header)'}
  else { Write-Host "src/main.tsx -> $line" }
  $root = ((curl.exe -I -L 'https://marketplace-frontend-mu-two.vercel.app/' 2>$null) | Select-String -Pattern 'Content-Type').ToString().Trim()
  Write-Host "/ -> $root"
  if ($line -and $line -notmatch 'application/octet-stream') { Write-Host 'Detected change in Content-Type.'; exit 0 }
  Start-Sleep -Seconds 15
}
Write-Host "Timeout: no change detected after $max attempts."
exit 2
