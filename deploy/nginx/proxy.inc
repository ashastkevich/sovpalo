# Адрес app берётся из DNS Docker при каждом запросе: после выкатки у контейнера новый IP
resolver 127.0.0.11 valid=10s ipv6=off;
set $app http://app:3000;
proxy_pass $app;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
