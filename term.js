(function() {
    const log = document.getElementById('log');
    const progressOuter = document.getElementById('progress-outer');
    const progressInner = document.getElementById('progress-inner');
    const promptArea = document.getElementById('prompt-area');
    const promptForm = document.getElementById('prompt-form');
    const promptInput = document.getElementById('prompt-input');
    const appletBody = document.getElementById('applet-body');

    const bootMessages = [
        { text: 'Loading applet...', delay: 0 },
        { text: 'Initializing JVM...', delay: 1500 },
        { text: 'Downloading classes (23KB)...', delay: 3000, startProgress: true },
        { text: 'Verifying bytecode...', delay: 6000 },
        { text: 'Linking native methods...', delay: 7500 },
        { text: 'Starting applet...', delay: 9000 },
        { text: 'Ready.', delay: 10000, done: true },
    ];

    function addLine(text) {
        const line = document.createElement('div');
        line.className = 'log-line';
        line.textContent = text;
        log.appendChild(line);
        appletBody.scrollTop = appletBody.scrollHeight;
    }

    // Boot sequence
    bootMessages.forEach(function(msg) {
        setTimeout(function() {
            addLine(msg.text);
            if (msg.startProgress) {
                progressOuter.style.display = 'block';
                let pct = 0;
                const interval = setInterval(function() {
                    pct += 2;
                    progressInner.style.width = pct + '%';
                    if (pct >= 100) clearInterval(interval);
                }, 120);
            }
            if (msg.done) {
                promptArea.style.display = 'block';
                promptInput.focus();
            }
        }, msg.delay);
    });

    // Generate a fake SocketException stack trace using the user's input
    function makeStackTrace(input) {
        const hosts = [
            'applet-relay.sun.com',
            'javabean-registry.oracle.com',
            'rmi-lookup.buer.dev',
            'class-server.netscape.net',
            'servlet-bridge.apache.org',
        ];
        const host = hosts[Math.floor(Math.random() * hosts.length)];
        const port = [8080, 443, 1099, 4848, 9090][Math.floor(Math.random() * 5)];

        return [
            'java.net.SocketException: Connection refused: connect',
            '    at java.net.PlainSocketImpl.socketConnect(Native Method)',
            '    at java.net.PlainSocketImpl.doConnect(PlainSocketImpl.java:351)',
            '    at java.net.PlainSocketImpl.connectToAddress(PlainSocketImpl.java:213)',
            '    at java.net.PlainSocketImpl.connect(PlainSocketImpl.java:200)',
            '    at java.net.Socket.connect(Socket.java:529)',
            '    at java.net.Socket.<init>(Socket.java:425)',
            '    at com.buer.terminal.NetClient.open(NetClient.java:87)',
            '    at com.buer.terminal.CommandDispatcher.dispatch(CommandDispatcher.java:143)',
            '    at com.buer.terminal.InputHandler.processLine(InputHandler.java:56)',
            '    at com.buer.terminal.BuerTerminal.run(BuerTerminal.java:31)',
            '    at java.applet.Applet.start(Applet.java:202)',
            'Caused by: java.net.ConnectException: Connection refused to host: ' + host + ':' + port,
            '    at sun.net.NetworkClient.doConnect(NetworkClient.java:180)',
            '    at sun.net.www.http.HttpClient.openServer(HttpClient.java:463)',
            '    at sun.net.www.http.HttpClient.<init>(HttpClient.java:210)',
            '    ... 7 more',
        ];
    }

    let busy = false;

    // Type out the echoed input character by character with random delay
    function typeEcho(text) {
        return new Promise(function(resolve) {
            const line = document.createElement('div');
            line.className = 'log-line';
            line.textContent = '';
            log.appendChild(line);
            let i = 0;
            function next() {
                if (i < text.length) {
                    line.textContent += text[i];
                    i++;
                    appletBody.scrollTop = appletBody.scrollHeight;
                    const delay = 100 + Math.random() * 200;
                    setTimeout(next, delay);
                } else {
                    resolve();
                }
            }
            next();
        });
    }

    // Print stack trace char by char, newlines create new divs
    function printStackTrace(lines) {
        const text = lines.join('\n');
        return new Promise(function(resolve) {
            let line = document.createElement('div');
            line.className = 'log-line';
            line.textContent = '';
            log.appendChild(line);
            let i = 0;
            function next() {
                if (i < text.length) {
                    if (text[i] === '\n') {
                        line = document.createElement('div');
                        line.className = 'log-line';
                        line.textContent = '';
                        log.appendChild(line);
                    } else {
                        line.textContent += text[i];
                    }
                    i++;
                    appletBody.scrollTop = appletBody.scrollHeight;
                    const delay = 10 + Math.random() * 50;
                    setTimeout(next, delay);
                } else {
                    resolve();
                }
            }
            next();
        });
    }

    promptForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (busy) return;
        const input = promptInput.value.trim();
        if (!input) return;

        busy = true;
        promptInput.value = '';
        promptInput.disabled = true;

        typeEcho('> ' + input).then(function() {
            const trace = makeStackTrace(input);
            setTimeout(function() {
                printStackTrace(trace).then(function() {
                    promptInput.disabled = false;
                    promptInput.focus();
                    busy = false;
                });
            }, 1200);
        });
    });
})();
