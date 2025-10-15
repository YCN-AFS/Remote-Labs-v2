# script to init Remote Lab PC

function Download-File {
    param(
        [string]$downloadUrl,
        [string]$destinationPath
    )
    Write-Output "Downloading file from $downloadUrl..."
	$progressPreference = 'SilentlyContinue' # for fixing slow download issue
    Invoke-WebRequest -Uri $downloadUrl -OutFile $destinationPath -UseBasicParsing
    Write-Output "Download completed."
}

function Create-Shortcut {
    param(
        [string]$shortcutPath,
        [string]$targetPath
    )
    $WScriptShell = New-Object -ComObject WScript.Shell
    $shortcut = $WScriptShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $targetPath
    $shortcut.Save()
}

function Install-VSCode {
	Write-Output "Installing Visual Studio Code..."

	# Define the download URL and paths
	$downloadUrl  = "https://update.code.visualstudio.com/latest/win32-x64/stable"
	$destinationPath = "$env:USERPROFILE\Downloads\VSCodeSetup.exe"
	Download-File -downloadUrl $downloadUrl -destinationPath $destinationPath

	# Install Visual Studio Code silently
	Write-Output "Opening Visual Studio Code..."
	Start-Process -FilePath $destinationPath -ArgumentList "/silent" -NoNewWindow -Wait

	# Remove the downloaded file
	Write-Output "Removing downloaded file..."
	Remove-Item -Path $destinationPath -Force

	# Create shortcuts for current user only
	Write-Output "Creating shortcuts..."
	$shortcutPathDesktop = "$env:USERPROFILE\Desktop\Visual Studio Code.lnk"
	$shortcutPathStartMenu = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Visual Studio Code.lnk"
	$exePath = "C:\Program Files\Microsoft VS Code\Code.exe"

	Create-Shortcut -shortcutPath $shortcutPathDesktop -targetPath $exePath
	Create-Shortcut -shortcutPath $shortcutPathStartMenu -targetPath $exePath

	Write-Output "Visual Studio Code installed successfully."
}

function Install-Arduino {
	Write-Output "Installing Arduino IDE..."

	# Define the download URL and paths
	$downloadUrl = "https://downloads.arduino.cc/arduino-ide/arduino-ide_latest_Windows_64bit.zip"
	$destinationPath = "$env:USERPROFILE\Downloads\arduino-ide-latest.zip"
	$installPath = "$env:USERPROFILE\Arduino"

	# Download the Arduino ZIP file
	Write-Output "Downloading Arduino IDE..."
	Download-File -downloadUrl $downloadUrl -destinationPath $destinationPath

	# Extract the ZIP to user directory
	Write-Output "Extracting Arduino IDE..."
	Expand-Archive -Path $destinationPath -DestinationPath $installPath -Force

	# Remove the downloaded file
	Write-Output "Removing downloaded file..."
	Remove-Item -Path $destinationPath -Force

	# Create shortcuts for current user only
	Write-Output "Creating shortcuts..."
	$shortcutPathDesktop = "$env:USERPROFILE\Desktop\Arduino IDE.lnk"
	$shortcutPathStartMenu = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Arduino IDE.lnk"
	$exePath = "$installPath\Arduino IDE.exe"

	Create-Shortcut -shortcutPath $shortcutPathDesktop -targetPath $exePath
	Create-Shortcut -shortcutPath $shortcutPathStartMenu -targetPath $exePath

	Write-Output "Arduino IDE installed successfully."

	# Open Arduino IDE
	Write-Output "Opening Arduino IDE..."
	Start-Process -FilePath $exePath -NoNewWindow
}

function Install-Camera {
	$destinationPath = ".\remote-lab-camera.zip"
	$installPath = "$env:USERPROFILE\remote-lab-camera"

	# Extract the ZIP to user directory
	Write-Output "Extracting Camera Viewer..."
	Expand-Archive -Path $destinationPath -DestinationPath $installPath -Force

	# Create shortcuts for current user only
	Write-Output "Creating shortcuts..."
	$shortcutPathDesktop = "$env:USERPROFILE\Desktop\Camera Viewer.lnk"
	$shortcutPathStartMenu = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Camera Viewer.lnk"
	$exePath = "$installPath\remote-lab-camera\remote-lab-camera.exe"

	Create-Shortcut -shortcutPath $shortcutPathDesktop -targetPath $exePath
	Create-Shortcut -shortcutPath $shortcutPathStartMenu -targetPath $exePath

	Write-Output "Camera Viewer installed successfully."

	# Open Camera Viewer
	Write-Output "Opening Camera Viewer..."
	Start-Process -FilePath $exePath -NoNewWindow
}

function Create-User {
    param(
        [string]$userName,
        [string]$password
    )

	$secureStr = ConvertTo-SecureString "lhu@B304" -AsPlainText -Force

	Write-Output "Creating user $userName..."

	if (Get-LocalUser -Name $userName -ErrorAction SilentlyContinue) {
		Write-Host "User 'Admin' exists, updating password..."
		Set-LocalUser -Name $userName -Password $secureStr
	} else {
		Write-Host "User 'Admin' does not exist, creating user..."
		New-LocalUser -Name $userName -Password $secureStr -FullName "Administrator" -Description "Admin User" -AccountNeverExpires
		Add-LocalGroupMember -Group "Administrators" -Member $userName
	}
}

function Enable-Remote-Desktop {
	Write-Output "Enabling Remote Desktop..."

	# Enable Remote Desktop
	Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name "fDenyTSConnections" -Value 0
	Enable-NetFirewallRule -DisplayGroup "Remote Desktop"
}

function Enable-PowerShell-Remoting {
	Write-Output "Enabling PowerShell Remoting..."

	# Enable PowerShell Remoting
	Enable-PSRemoting -Force
}

function Extract-SSH-Key {
	$filePath = ".\ssh.zip"
	$extractPath = "C:\Users\Admin\"
	Expand-Archive -Path $filePath -DestinationPath $extractPath -Force
	Remove-Item $filePath -Force
}

function Import-Task-SSH-5985 {
    param(
        [string]$userName,
        [string]$password
    )
	Write-Host "Importing Task SSH-5985..."
	schtasks /create /tn "ssh-5985" /xml ".\ssh-5985.xml" /ru $userName /rp $password
}

function Register-Computer {
	Write-Output "=========================================="
	Write-Output "Registering computer to Remote Lab system..."
	Write-Output "=========================================="
	
	try {
		# Get computer information
		$computerName = $env:COMPUTERNAME
		Write-Output "Computer Name: $computerName"
		
		# Get IP address
		$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress
		Write-Output "IP Address: $ipAddress"
		
		# Generate unique computer ID
		$computerId = "pc-$computerName".ToLower()
		Write-Output "Computer ID: $computerId"
		
		# Prepare registration data
		$registrationData = @{
			name = "PC $computerName"
			description = "Máy tính thực hành $computerName - IP: $ipAddress"
			natPortRdp = 3389
			natPortWinRm = 5985
		}
		
		$jsonData = $registrationData | ConvertTo-Json -Depth 3
		Write-Output "Registration Data: $jsonData"
		
		# Test backend connectivity first
		Write-Output "Testing backend connectivity..."
		$testResponse = Invoke-WebRequest -Uri "http://103.218.122.188:8000/" -Method GET -TimeoutSec 10
		Write-Output "Backend is reachable (Status: $($testResponse.StatusCode))"
		
		# Register with backend API
		Write-Output "Sending registration request..."
		$response = Invoke-RestMethod -Uri "http://103.218.122.188:8000/api/computer/register" -Method POST -Body $jsonData -ContentType "application/json" -TimeoutSec 30
		Write-Output "✅ Computer registered successfully!"
		Write-Output "Response: $($response | ConvertTo-Json -Depth 3)"
		
	} catch {
		Write-Output "❌ Registration failed!"
		Write-Output "Error Type: $($_.Exception.GetType().Name)"
		Write-Output "Error Message: $($_.Exception.Message)"
		if ($_.Exception.Response) {
			Write-Output "HTTP Status: $($_.Exception.Response.StatusCode)"
			Write-Output "HTTP Description: $($_.Exception.Response.StatusDescription)"
		}
		Write-Output "Computer will need to be registered manually via dashboard"
		Write-Output "Dashboard URL: http://103.218.122.188:8080/dashboard/computer"
	}
	
	Write-Output "=========================================="
}

$adminUser = "T&A"
$adminPassword = "1"
Install-Camera
Install-VSCode
Install-Arduino
Create-User -userName $adminUser -password $adminPassword
Enable-Remote-Desktop
Enable-PowerShell-Remoting
Extract-SSH-Key
Import-Task-SSH-5985 -userName $adminUser -password $adminPassword
Register-Computer
