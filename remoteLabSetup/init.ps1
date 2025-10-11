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

	# Create shortcuts for all users
	Write-Output "Creating shortcuts..."
	$shortcutPathDesktop = "$env:PUBLIC\Desktop\Visual Studio Code.lnk"
	$shortcutPathStartMenu = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Visual Studio Code.lnk"
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
	$installPath = "C:\Program Files\Arduino"

	# Download the Arduino ZIP file
	Write-Output "Downloading Arduino IDE..."
	Download-File -downloadUrl $downloadUrl -destinationPath $destinationPath

	# Extract the ZIP to C:\Program Files
	Write-Output "Extracting Arduino IDE..."
	Expand-Archive -Path $destinationPath -DestinationPath $installPath -Force

	# Remove the downloaded file
	Write-Output "Removing downloaded file..."
	Remove-Item -Path $destinationPath -Force

	# Create shortcuts for all users
	Write-Output "Creating shortcuts..."
	$shortcutPathDesktop = "$env:PUBLIC\Desktop\Arduino IDE.lnk"
	$shortcutPathStartMenu = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Arduino IDE.lnk"
	$exePath = "$installPath\Arduino IDE.exe"

	Create-Shortcut -shortcutPath $shortcutPathDesktop -targetPath $exePath
	Create-Shortcut -shortcutPath $shortcutPathStartMenu -targetPath $exePath

	Write-Output "Arduino IDE installed system-wide successfully."

	# Open Arduino IDE
	Write-Output "Opening Arduino IDE..."
	Start-Process -FilePath $exePath -NoNewWindow
}

function Install-Camera {
	$destinationPath = ".\remote-lab-camera.zip"
	$installPath = "C:\Program Files\remote-lab-camera"

	# Extract the ZIP to C:\Program Files
	Write-Output "Extracting Camera Viewer..."
	Expand-Archive -Path $destinationPath -DestinationPath $installPath -Force

	# Create shortcuts for all users
	Write-Output "Creating shortcuts..."
	$shortcutPathDesktop = "$env:PUBLIC\Desktop\Camera Viewer.lnk"
	$shortcutPathStartMenu = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Camera Viewer.lnk"
	$exePath = "$installPath\remote-lab-camera\remote-lab-camera.exe"

	Create-Shortcut -shortcutPath $shortcutPathDesktop -targetPath $exePath
	Create-Shortcut -shortcutPath $shortcutPathStartMenu -targetPath $exePath

	Write-Output "Camera Viewer installed system-wide successfully."

	# Open Arduino IDE
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

$adminUser = "Admin"
$adminPassword = "lhu@B304"
Install-Camera
Install-VSCode
Install-Arduino
Create-User -userName $adminUser -password $adminPassword
Enable-Remote-Desktop
Enable-PowerShell-Remoting
Extract-SSH-Key
Import-Task-SSH-5985 -userName $adminUser -password $adminPassword
