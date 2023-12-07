Connor Marshall
12/7/2023
Designed for Lindenwood IOT Course
under Dr Blythe

Description:
  This repo contains all code used in the fa23 IOT project demonstrations. This project is
  designed to create a wireless accesspoint, hosted on a raspberry pi, where video feeds can be streamed 
  via web browser on smart phones to be encoded and uploaded to cloud storage.


Hardware Reqs:
  This project was demonstrated with everything hosted on one raspberry pi. This pi runs a webserver using apache2 hosting the
  certDownload page and client app to be accessed by devices connected to it's hostapd hosted wireless network. It then uses either ethernet
  or a seperate wifi antenna to incrementally upload created videos to onedrive cloud storage.


Code Organization:
  This repo contains 3 directories. All node_modules are excluded from the client and server code and need to be installed before
  use.

  -CertDownload
    this is a VERY SIMPLE placeholder html page that was hosted on the pi in order to download required certificates
    needed to reach hosted https web pages without warnings from mobile browsers

  -client
    This is a react app webapp client poc designed with smarphone browsers in mind. This https designed client can access
    user's cameras and send frame data over websocket to a backend server on the network.

    *some dev experimentation has been on phone encoded video proccessing as well and is under LocalEncodeStreamCam component. 
    this is WIP

  -server
    This is the node.js server code designed to recieve the websocket transmitted frame data and encode this into mp4 videos.
    This also handles onedrive api cloud video uploads.

    *temporary certs and key is included in server repo only for local dev testing, not used for pi setup.


Using This Application:
  As set up in demo everything is hosted on a raspberry pi 4. A user connects to the hostapd network of the pi. This allows them to then
  reach the apache2 webserver and download certificates and open the client webapp. The pi will also need to be running the node.js server
  for the client to communicate with. When running the web app on a mobile device or computer browser with camera the feed of the camera will
  be sent to the node server. This node server will then encode and upload videos to cloud storage.

  *Cloud storage upload requires a manually retrieved, 1 hour, access token for now until auto token refreshing and aquiring is set up. 