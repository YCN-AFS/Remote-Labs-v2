#!/usr/bin/env pwsh

# Script to authenticate PowerShell with a credential and execute a command
# ex: ./pwsh.ps1 -ComputerName 192.168.1.2 -Command 'net users'

param (
    [string]$ComputerName,  # Remote machine IP or hostname
    [string]$Port,  # Remote machine PORT
    [string]$Command,       # The command to execute remotely
    [string]$CredentialPath = "credential.xml"  # Path to credential file
)

# Import credentials from credential.xml
$cred = Import-Clixml -Path $CredentialPath

# Execute the input command on the remote machine using SSH
Invoke-Command -ComputerName $ComputerName -Port $Port -Credential $cred -ScriptBlock {
    Invoke-Expression $using:Command  # Use the input command
}

