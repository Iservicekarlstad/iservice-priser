# iService – prisfil till hemsidan

`priser.json` med de publika köp- och säljpriserna som kalkylerna på iservicesverige.se läser:
https://iservicekarlstad.github.io/iservice-priser/priser.json

GitHub hämtar priserna från KassaApps Cloudflare-tjänst (iservice-sync, /kassa) var 10:e minut (`update.mjs`) och publicerar filen
bara när något har ändrats, plus en gång per dygn så att hemsidan ser att filen är färsk.
Filen innehåller inga inköpspriser, marginaler eller kassadata.

Köra för hand: fliken **Actions → Uppdatera prisfilen → Run workflow**.
