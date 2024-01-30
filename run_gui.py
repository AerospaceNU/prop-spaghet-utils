import webbrowser
import http.server
import socketserver

# Define the handler to use for incoming requests
handler = http.server.SimpleHTTPRequestHandler

# Set the port number for the server
port = 8000

# Create the server and bind it to the specified port
httpd = socketserver.TCPServer(("", port), handler)

print(f"Serving on port {port}")

webbrowser.open_new(f"http://localhost:{port}")
print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
print(f"Consider copy pasting the URL over to an INCOGNITO WINDOW (if some changes don't seem to be applied!)")
print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

# Run the server indefinitely
httpd.serve_forever()

