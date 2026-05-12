# Matthix.Web

## FTP deployment

GitHub Actions deployt die statische Website bei jedem Push auf `main` per FTP.

In GitHub unter `Settings` -> `Secrets and variables` -> `Actions` diese Repository-Secrets anlegen:

- `FTP_HOST`: FTP-Hostname, zum Beispiel `ftp.example.com`
- `FTP_PORT`: optionaler FTP-Port, wenn leer wird `21` verwendet
- `FTP_USERNAME`: FTP-Benutzername
- `FTP_PASSWORD`: FTP-Passwort
- `FTP_REMOTE_DIR`: Zielordner auf dem Server, zum Beispiel `/public_html/`
