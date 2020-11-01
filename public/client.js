// Store for all of the jobs in progress
let jobs = {};

let lread = function(key) {
    key = btoa(key);
    let x = localStorage.getItem(key);
    return x = atob(x);
}

let lkeep = function(key, value) {
    key = btoa(key);
    value = btoa(value);
    localStorage.setItem(key, value);
    return key;
}

async function upSubmitHandler(e) {
	e.preventDefault();
	var fd = new FormData();
    var request = new XMLHttpRequest();
    request.open("POST", e.target.action, true);
    fd.append("video", 
        document.querySelector('#up-input').files[0], 
        document.querySelector('#up-input').files[0].name);
    request.send(fd);

    let submitBtn = document.getElementById('add-job-up');
    let orgHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Uploading...";

    request.onload = function(oEvent) {
        if (request.status < 300 && request.status >= 200) {
            console.log("Uploaded!");
            submitBtn.disabled = false;
            submitBtn.innerHTML = orgHtml;
            let job = JSON.parse(request.response);

            if(lread("debug") == "true")
                console.log(job);

            jobs[job.id] = { id: job.id1, state: "queued", mode: "up" };
            render();
        } else {
            console.log("Error!");
            submitBtn.disabled = false;
            submitBtn.innerHTML = orgHtml;
            console.log(request.response);
        }
    };
}

async function sdSubmitHandler(e) {
	e.preventDefault();
	let url = document.getElementById('sd-input').value;
	let submitBtn = document.getElementById('add-job-sd');
	let orgHtml = submitBtn.innerHTML;
	submitBtn.disabled = true;
	submitBtn.innerHTML = "Adding to queue";

	let res = await fetch(e.target.action + "?url=" + url, { method: "POST" });
    if(lread("debug") == "true")
	   console.log(e.target.action + "?url=" + url);
    let job = await res.json();

    if(lread("debug") == "true")
        console.log(job);

    submitBtn.disabled = false;
	submitBtn.innerHTML = orgHtml;
	
    jobs[job.id1] = { id: job.id1, state: "queued", mode: "sd" };
    render();
}

// Fetch updates for each job
async function updateJobs() {
    for (let id of Object.keys(jobs)) {
        if(lread("debug") == "true")
            console.log(jobs[id]);
        let res = await fetch(`/job/${id}/status?mode=${jobs[id].mode}`);
        let result = await res.json();
        if (!!jobs[id]) {
            jobs[id].state = result.state;
            jobs[id].reason = result.reason;
            jobs[id].progress = result.progress;
        }
        render();
    }
}

// Delete all stored jobs
function clear() {
    jobs = {};
    render();
}

// Update the UI
function render() {
    let s = "";
    for (let id of Object.keys(jobs)) {
        s += renderJob(jobs[id]);
    }

    document.querySelector("#job-summary").innerHTML = s;
}

// Renders the HTML for each job object
function renderJob(job) {
    let progress = job.progress || 0;
    let color = "bg-light-purple";

    if (job.state === "completed" && job.mode === "sd") {
        color = "bg-green";
        progress = 100;
    } else if (job.state === "completed" && job.mode === "up") {
        color = "bg-purple";
        progress = 100;
    } else if (job.state === "failed") {
        color = "bg-dark-red";
        progress = 100;
    }

    return document.querySelector('#job-template')
        .innerHTML
        .replaceAll('{{id}}', job.id)
        .replace('{{state}}', job.state)
        .replace('{{color}}', color)
        .replace('{{progress}}', progress)
        .replace('{{mode}}', job.mode);
}

// Attach click handlers and kick off background processes
window.onload = function() {
    document.querySelector("#sd-form").addEventListener("submit", sdSubmitHandler);
    document.querySelector("#up-form").addEventListener("submit", upSubmitHandler);
    document.querySelector("#clear").addEventListener("click", clear);

    setInterval(updateJobs, 400);
};