```markdown
##############################################################################

This section of the README provides configuration details for setting up a Laravel application with Nginx. It includes directives for SSL configuration, proxying WebSocket requests, and ensuring security headers are properly set.
##############################################################################



##############################################################################
In package.json
{
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "mix",
        "watch": "mix watch",
        "hot": "mix watch --hot",
        "prod": "mix --production",
        "start": "node server.js"
    },
    "devDependencies": {
        "axios": "^1.6.8",
        "cross-env": "^7.0",
        "laravel-mix": "^6.0.0"
    },
    "dependencies": {
        "express": "^4.18.2",
        "http": "^0.0.1-security",
        "pm2": "^5.3.0",
        "socket.io": "^4.7.2",
        "socket.io-client": "^4.7.2"
    }
}

##############################################################################



##############################################################################
## In server.js

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();

const server = createServer(app);
const io = new Server(server, {
    cors: {
        methods: ['GET', 'PATCH', 'POST', 'PUT'],
        origin: true,
        credentials: true,
        transports: ['websocket', 'polling'],
    },
});

const sendTime = () => {
    const currentTime = new Date().toJSON();
    io.emit('time', { time: currentTime });
    console.log('EMIT: time', currentTime);
};

setInterval(sendTime, 10000);

io.on('connection', (socket) => {
    console.log('connection');

    socket.on('clientMessage', (data) => {
        console.log('ON: clientMessage');
        socket.emit(serverResponse, { message: 'Received message! Returning message!!' });
        console.log('EMIT: fromServer');
    });

    socket.on('sendChatToServer', (message) => {
        console.log(message);
        socket.broadcast.emit('sendChatToClient', message);
    });

    socket.on('disconnect', () => {
        console.log('Disconnect');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log('Server is running');
});

##############################################################################


##############################################################################
in your blade

    <div class="container">
        <button id="clientMessage">
            From Client
        </button>
        <br>
        <div class="row chat-row">
            <div class="chat-content">
                <ul>

                </ul>
            </div>

            <div class="chat-section">
                <div class="chat-box">
                    <div class="chat-input bg-primary" id="chatInput" contenteditable="">

                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.js" integrity="sha256-H+K7U5CnXl1h5ywQfKtSj8PCmoN9aaq30gDh27Xc0jk="
        crossorigin="anonymous"></script>
    <script src="https://cdn.socket.io/4.0.1/socket.io.min.js"
        integrity="sha384-LzhRnpGmQP+lOvWruF/lgkcqD+WDVt9fU3H4BWmwP5u5LTmkUGafMcpZKNObVMLU" crossorigin="anonymous">
    </script>



    <script>
        $(function() {
            // let ip_address = '127.0.0.1'; // L
            var socket = io('https://www.tripia.co');

            //-------------------------------------------------
            socket.on('serverResponse', function(data) {
                console.log('ON: fromServer');
            });

            socket.on('time', function(data) {
                console.log('ON: time');
            });

            document.getElementById('clientMessage').onclick = function() {

                socket.emit('clientMessage', {
                    "message": "Sent from client!"
                });
                console.log('EMIT: clientMessage');

            }
            //-------------------------------------------------
            let chatInput = $('#chatInput');

            chatInput.keypress(function(e) {
                let message = $(this).html();
                console.log(message);
                if (e.which === 13 && !e.shiftKey) {
                    socket.emit('sendChatToServer', message);
                    chatInput.html('');
                    return false;
                }
            });

            socket.on('sendChatToClient', (message) => {
                $('.chat-content ul').append(`<li>${message}</li>`);
            });
        });
    </script>

##############################################################################


##############################################################################
## In /etc/nginx/sites-enabled/laravel

server {
    server_name _ www.tripia.co tripia.co;
    root /var/www/laravel/public;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    # PHP processing
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Deny access to hidden files
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Proxy WebSocket requests
    location /socket.io/ {
        proxy_pass             http://127.0.0.1:3000;
        proxy_set_header Host  $host;
        proxy_read_timeout     60;
        proxy_connect_timeout  60;
        proxy_redirect         off;

        # Allow the use of websockets
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # SSL Configuration (managed by Certbot)
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/www.tripia.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.tripia.co/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

}

server {
    # Redirect HTTP to HTTPS (managed by Certbot)
    if ($host = www.tripia.co) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name _ www.tripia.co tripia.co;
    return 404;
}
##############################################################################


##############################################################################

This section provides instructions for ensuring that firewall rules allow traffic on port 3000, restarting Nginx, and performing debugging steps if needed.

Ensure Firewall Allows Traffic on Port 3000
: sudo ufw allow 3000

Restart Nginx and Verify
: sudo systemctl restart nginx

Debugging Steps
If the issue persists, you can try these debugging steps:
Check if your Node.js server is running and listening on port 3000.
You can use the netstat command to verify this:
: sudo netstat -tuln | grep 3000

##############################################################################


##############################################################################

This section provides information about the directory containing SSL keys and certificates, as well as instructions for installing PM2 globally, starting, and stopping a Node.js server.

This directory contains your keys and certificates
cd /etc/letsencrypt/live/www.tripia.co

npm install pm2 -g
cd /var/www/laravel
: pm2 start server.js
: pm2 stop server.js

##############################################################################
```

This description provides an overview of the configuration details and instructions provided in the README section. It explains each section's purpose and the actions users should take based on the information provided.