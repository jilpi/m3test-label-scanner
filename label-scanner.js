// # Global Variables
// ## Latest QR Scanner readings
var latestResult = "";
var latestResultTime = new Date().getTime();
// API
var authorizationToken = "";//"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjozLCJlbWFpbCI6ImotbC5waWNhcmRAbS0zLmNvbSIsInVzZXJuYW1lIjpudWxsLCJmaXJzdG5hbWUiOm51bGwsImxhc3RuYW1lIjpudWxsLCJjb3VudHJ5X2NvZGUiOm51bGwsIm1vYmlsZSI6bnVsbCwiYmlydGhkYXRlIjpudWxsLCJnZW5kZXIiOm51bGwsImNvbmZpcm1lZCI6dHJ1ZSwicm9sZSI6eyJsYWJlbCI6IkFkbWluIn19LCJpYXQiOjE2MDUxMDUyMzIsImV4cCI6MTYwNTE5MTYzMn0.ZBj0V1ExNP9vuNIdqsQNsnCVLSLdQMCIqur982T3ztA";


// # Constants declarations
// ## Key HTML Elements
const video = document.getElementById('qr-video');
const camHasCamera = document.getElementById('cam-has-camera');
const camQrResult = document.getElementById('cam-qr-result');
const camQrResultTimestamp = document.getElementById('cam-qr-result-timestamp');
const autoprintToggle = document.getElementById('autoprint-toggle');
const loginStatus = document.getElementById('loginstatus');
const loginbtn = document.getElementById('loginbtn');

const labelIframe = document.getElementById('label');

// ## API
const REST_API_URL="https://m3-test.ch/api/";
const API_LABEL_INFO_PATH = "test/info?code=";
const API_ENDPOINT_LOGIN = 'auth/login';
var REST_API_REQUEST_HEADERS=setAuthHeaders();

// ## Others
const REPRINT_INTERVAL = 5000;

// # Main program 
// ## Check camera
QrScanner.hasCamera().then(
    function(hasCamera) {
        console.info(`  - Camera${hasCamera?"":" not"} found`);
        camHasCamera.textContent = hasCamera ? "✅" : "❌"
    }
);

// ## QR Scanner
console.info("QR SCANNER - STARTS");

// Import library
import QrScanner from "./qr-scanner/qr-scanner.min.js";
QrScanner.WORKER_PATH = './qr-scanner/qr-scanner-worker.min.js';

// Instantiate Scanner
console.info("- Instantiate scanner");
const scanner = new QrScanner(video, result => checkQrCode(result), error => {
    // camQrResult.textContent = error;
    // camQrResult.style.color = 'inherit';
});

// for debugging
window.scanner = scanner;

// ## Setup html elements
console.info("- Display scan area");
document.getElementsByTagName("scan-preview")[0].appendChild(scanner.$canvas);
scanner.$canvas.height="50";
scanner.$canvas.style.display = 'block';

// ## Start Scanner
console.info("- Start scanner");
startScanner();

// # Setup buttons
// ## Check Code Manually
document.getElementById("btn-check-qrcode").onclick = function(){
    console.info("- Retrieving data for booking ID" + camQrResult.value)
    checkQrCode(camQrResult.value);                
}

loginbtn.onclick = loginprocess;

async function loginprocess(){
    var email = prompt("Your email?");
    var password = prompt("Your password?");
    await axios.post(REST_API_URL + API_ENDPOINT_LOGIN, 
        {
            'email': email,
            'password': password
        } )
        // Handle a successful response from the server
        .then(
            function (response) {
                authorizationToken = response.data.token;
                setAuthHeaders();
                console.log(response);
                console.log(authorizationToken);
            }
        )
        // Catch and print errors if any
        .catch(function(error){
                console.error('API Call', error)
            }
        );


}


async function getBookingDataFromAPI(id){
    // API request
    var strEndPoint = REST_API_URL + API_LABEL_INFO_PATH + id;
    var data = {};

    console.info(`  - API call at: ${strEndPoint}`);
    console.info(`    (headers: `+REST_API_REQUEST_HEADERS+`)`);
    await axios.get(strEndPoint, { headers: REST_API_REQUEST_HEADERS })
        // Handle a successful response from the server
        .then(
            function (response) {
                // Getting a data object from response that contains the necessary data from the server
                data["code"] = response.data.code;
                data["site_name"] = response.data.site.name;
                data["service_type"] = "COV19-RAPID";
                data["firstname"] = response.data.patient.firstname;
                data["lastname"] = response.data.patient.lastname;
                var birthdate = new Date(Date.parse(response.data.patient.birthdate));
                data["dob"] = birthdate.getDate() + "-" + (birthdate.getMonth()+1) + "-" + birthdate.getFullYear()
                data["gender"] = response.data.patient.gender;
                data["avs"] = response.data.patient.avs;
                data["insurance"] = response.data.patient.insurer_number;
                data["mobile"] = response.data.patient.country_code + "-" + response.data.patient.mobile;
                data["email"] = response.data.user.email;                
            }
        )
        // Catch and print errors if any
        .catch(function(error){
                console.error('API Call error', error)
            }
        );
    
    return data;
}

async function printLabel(id){

    // get attributes from API / booking id
    console.info(`- API Call for ${id}`);
    const bookingData = await getBookingDataFromAPI(id);
    console.log('  - Data returned:', bookingData);

    if (autoprintToggle.checked){
        bookingData.autoprint="";
        console.info('  - Autoprint enabled')
    }



    console.info(`- Generate label ${id}`);
    const baseUrl = document.URL.substr(0,document.URL.lastIndexOf('/'));
    const labelUrl = new URL(baseUrl + '/generator/label-generator.html');
    labelUrl.search = new URLSearchParams(bookingData);
    console.info(`  - Label URL: ${labelUrl.toString()}`);
    labelIframe.src = labelUrl;
}

function startScanner() {
    var result = scanner.start();
    if (result)
        console.info("  - Scanner started successfully");
    else
        console.error("  - Scanner failed to start !!");
}

function checkQrCode(result) {
    // Get new label?
    // Yes if:
    //    - the scanned code is NEW
    //    - the scanned code is the same as last time, but wasn't scanned for > REPRINT_INTERVAL milliseconds
    if ((latestResult != result)
            || (latestResult = result) && (Date.now() - latestResultTime > REPRINT_INTERVAL)) {

        printLabel(result);
    }

    // Update latest result
    camQrResult.value = result;
    latestResult = result;
    
    // Update latest result time
    latestResultTime = Date.now();
    camQrResultTimestamp.textContent = Date();

    // Change result color for REPRINT_INTERVAL milliseconds to indicate timeout
    label.style.color = 'red';
    clearTimeout(label.highlightTimeout);
    label.highlightTimeout = setTimeout(() => label.style.color = 'inherit', 5000);

}

function setAuthHeaders(){
    REST_API_REQUEST_HEADERS = {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + authorizationToken
    }
}

// # Tools
// renameKey in an object
function renameKey(o, old_key, new_key){
    if (old_key !== new_key) {
        Object.defineProperty(o, new_key,
           Object.getOwnPropertyDescriptor(o, old_key));
        delete o[old_key];
    }
}


