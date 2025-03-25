# observations-api

HTTP API for observations built with [Astro](https://docs.astro.build)

## Development

```ini
.env
ALBINA_LOLA_KRONOS_API_TOKEN=
ALBINA_LWDKIP_PASSWORD=
ALBINA_LWDKIP_USERNAME=
ALBINA_SMET_API=
ALBINA_WIKISNOW_API=
MYSQL_HOST=
MYSQL_PORT=
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=

```

```sh
> cd observations-api/
> corepack enable
> yarn install
> yarn dev
```

## Deployment

Build

```sh
> observations-api/
> corepack enable
> yarn install
> yarn build
```

Copy to server

```sh
> rsync --recursive observations-api/ sftp://api.example.com/opt/observations-api/
> ls /opt/observations-api/
/opt/observations-api/dist/server/entry.mjs
/opt/observations-api/node_modules/
/opt/observations-api/package.json
```

Configure as systemd service

```sh
> systemctl cat observations-api.service
# /etc/systemd/system/observations-api.service
[Unit]
Wants=network-online.target
After=network-online.target

[Service]
Environment=ALBINA_ALPSOLUT_API_TOKEN=
Environment=ALBINA_LOLA_KRONOS_API_TOKEN=
Environment=ALBINA_LWDKIP_PASSWORD=
Environment=ALBINA_LWDKIP_USERNAME=
Environment=ALBINA_SMET_API=
Environment=ALBINA_WIKISNOW_API=
Environment=MYSQL_HOST=
Environment=MYSQL_PORT=
Environment=MYSQL_USER=
Environment=MYSQL_PASSWORD=
Environment=MYSQL_DATABASE=
Environment=LOKANDO_API=
Environment=LOKANDO_API_KEY=
Environment=PORT=3000
ExecStartPre=/usr/bin/yarn install
ExecStart=/usr/bin/node dist/server/entry.mjs
MemoryAccounting=yes
MemoryHigh=1G
MemoryMax=2G
PrivateTmp=true
ProtectSystem=full
Restart=always
User=albina-admin-gui
WorkingDirectory=/opt/observations-api/

[Install]
WantedBy=multi-user.target
```

Configure Caddy as reverse proxy

```
# Caddyfile
api.example.com {
	handle /albina/* {
		# albina-server (Apache Tomcat)
		reverse_proxy "localhost:8080"
	}
	handle_path /albina/api_ext/* {
		forward_auth localhost:8080 {
			uri /albina/api/authentication/test
			header_down -*
		}
		import admin_proxy
		reverse_proxy "localhost:3000"
	}
}
```
