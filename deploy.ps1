<#
deploy.ps1
A helper PowerShell script to automate git push and set GitHub repo secrets (requires gh CLI for some steps).
This script DOES NOT (and cannot) create Render services or set Render environment variables automatically.
It prepares the repo, pushes to GitHub (or uses an existing remote), and optionally sets GitHub secrets using gh CLI.
#>

# Ensure running from repository root
if (-not (Test-Path ".git")) {
  Write-Host "Initializing git repository..."
  git init
  git checkout -b main
}

# Ensure files are added and committed
git add .
git commit -m "Deploy: Helwan Smart Campus - prepare for Render" 2>$null

# Ask user for repo
$repoUrl = Read-Host "If you already have a GitHub repo remote URL paste it here (or press Enter to create a new repo via gh)"
if ([string]::IsNullOrWhiteSpace($repoUrl)) {
  if (Get-Command gh -ErrorAction SilentlyContinue) {
    $repoName = Read-Host "Enter repository name to create on GitHub (e.g. helwan-smart-campus)"
    if ([string]::IsNullOrWhiteSpace($repoName)) { Write-Host "Repo name is required. Exiting."; exit 1 }
    Write-Host "Creating GitHub repo using gh..."
    gh repo create $repoName --public --source=. --remote=origin --push --confirm
    $repoFullName = gh repo view --json nameWithOwner -q .nameWithOwner
  } else {
    Write-Host "gh CLI not found. Please create the repo manually on GitHub, copy the remote URL, and re-run this script."
    exit 1
  }
} else {
  # add remote if not present
  try { git remote add origin $repoUrl } catch { Write-Host "Remote origin may already exist, continuing..." }
  Write-Host "Pushing to remote..."
  git push -u origin main
  # parse owner/repo from URL
  if ($repoUrl -match "github.com[:/]+([^/]+)/([^/.]+)") {
    $owner = $matches[1]; $repoName = $matches[2];
    $repoFullName = "$owner/$repoName"
  }
}

# Optionally set GitHub repo secrets via gh
if (Get-Command gh -ErrorAction SilentlyContinue) {
  Write-Host "`nNow I'll help you set GitHub repository secrets (MONGO_URI, JWT_SECRET, VITE_API_URL)."
  $setSecrets = Read-Host "Do you want to set GitHub repo secrets now using gh? (y/N)"
  if ($setSecrets -match '^[yY]') {
    $mongo = Read-Host "Paste your MongoDB Atlas connection string (mongodb+srv://... )"
    gh secret set MONGO_URI --body $mongo --repo $repoFullName

    $jwt = Read-Host "Enter JWT secret (e.g., helwan-smart-campus-secret)"
    gh secret set JWT_SECRET --body $jwt --repo $repoFullName

    $vite = Read-Host "Enter VITE_API_URL (example: https://helwan-backend.onrender.com/api)"
    gh secret set VITE_API_URL --body $vite --repo $repoFullName

    Write-Host "GitHub secrets set successfully."
  } else {
    Write-Host "Skipping GitHub secrets step. You can set them later in the GitHub repo settings or via gh."
  }
} else {
  Write-Host "`nNote: gh CLI not found. To set GitHub secrets automatically, install GitHub CLI (gh) and re-run this script."
}

Write-Host "`nDone. Next steps (manual):"
Write-Host "1) Go to https://dashboard.render.com, click 'New' -> 'Import from Git' -> select the repository $repoFullName."
Write-Host "2) When Render asks for env vars, set MONGO_URI and JWT_SECRET for the backend, and VITE_API_URL for the frontend (VITE_API_URL should be backendURL + '/api')."
Write-Host "3) Deploy and wait for Render build logs to complete."
Write-Host "`nIf you want, you can paste any Render build logs or errors here and I'll help fix them."