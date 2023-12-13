const PORT = process.env.PORT || 2222;
const XMLHttpRequest = require('xhr2');
const http = require('http');
const express = require('express');
const app = express();
const server = http.Server(app);
const path = require('path');
const bp = require('body-parser');
const HTMLParser = require('node-html-parser');
const fs = require('fs');
const { response } = require('express');

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});
server.listen(PORT, function() {
    console.log('Server port 2222');
});

app.get('/rasp', (req,res) => {
    let request = new XMLHttpRequest();
    let url = "https://ssau.ru" + req.url;
    request.open("GET", url, true);
    request.send(null);
    request.onreadystatechange = () => {
        if (request.readyState == 4) {
            let schedule = {
                dates: [],
                lessons: [],
                leftColumn: []
            };
            let root = HTMLParser.parse(request.responseText);

            for (let cell of root.querySelectorAll(".schedule__item")) {
                if (cell.querySelector(".schedule__discipline")) {
                    let cellGroups = [];
                    if (!!cell.querySelectorAll(".schedule__group").length) {
                        for (let group of cell.querySelectorAll(".schedule__group")) {
                            if (group.innerText.trim() !== "") {
                                cellGroups.push(JSON.stringify({
                                    name: group.innerText,
                                    link: group.getAttribute("href") ?? null
                                }))
                            } else {
                                cellGroups.push(JSON.stringify({
                                    name: "",
                                    link: null
                                }))
                            }
                        }
                    } 
                    schedule.lessons.push({
                        subject: cell.querySelector(".schedule__discipline").innerText,
                        place: cell.querySelector(".schedule__place").innerText,
                        teacher: JSON.stringify(cell.querySelector(".schedule__teacher > .caption-text") === null ?
                            {
                                name: "",
                                link: null,
                            } :
                            {
                                name: cell.querySelector(".schedule__teacher > .caption-text") ? cell.querySelector(".schedule__teacher > .caption-text").innerText : "",
                                link: cell.querySelector(".schedule__teacher > .caption-text").getAttribute("href")
                            }),
                        groups: cellGroups
                    })
                } else if (!!root.querySelectorAll(".schedule__item + .schedule__head").length && !schedule.dates.length) {
                    for (let cell of root.querySelectorAll(".schedule__item + .schedule__head")) {
                        schedule.dates.push(cell.childNodes[0].innerText + cell.childNodes[1].innerText)
                    }
                } else {
                    schedule.lessons.push({
                        subject: null
                    })
                }
            }
            for (let cell of root.querySelectorAll(".schedule__time")) {
                schedule.leftColumn.push(cell.childNodes[0].innerText + cell.childNodes[1].innerText);
            }
            schedule["currentWeek"] = root.querySelector(".week-nav-current_week")?.innerText;
            schedule.lessons = schedule.lessons.slice(6, schedule.lessons.length);
            res.send(JSON.stringify(schedule));
        }
    };
} )

app.get('/GroupsAndTeachers', (req, res) => {
    res.sendFile(path.join(__dirname, 'GroupsAndTeachers.json'));
})

function saveGroupsAndTeachers() {
    let allHTMLGroups = [];
    let allHTMLTeachers = [];
    let result = { groups: [], teachers: [] };
    let groupsCount = 0;
    let teachersCount = 0;
    for (let i = 1; i < 6; i++) {
        let request = new XMLHttpRequest();
        let url = "https://ssau.ru/rasp/faculty/492430598?course=" + i;
        request.open("GET", url, true);
        request.send(null);
        request.onreadystatechange = () => {
            if (request.readyState == 4) {
                groupsCount++;
                allHTMLGroups.push(request.responseText);
                if (groupsCount === 5) {
                    for (let group of allHTMLGroups) {
                        let root = HTMLParser.parse(group);
                        let groups = root.querySelectorAll(".group-catalog__groups > a");   
                        for (let group of groups) {
                            const id = group.getAttribute("href").replace(/\D/g, '');
                            result.groups.push({ name: group.innerText, link: `/rasp?groupId=${id}` })
                        }
                    fs.writeFile("GroupsAndTeachers.json", JSON.stringify(result), () => console.log('Data saved to file'));
                    }
                
                };
            }
        }   
    }
    for (let i = 1; i < 116; i++) {
        let request = new XMLHttpRequest();
        let url = "https://ssau.ru/staff?page=" + i;
        request.open("GET", url, true);
        request.send(null);
        request.onreadystatechange = () => {
            if (request.readyState == 4) {
                teachersCount++;
                allHTMLTeachers.push(request.responseText);
                if (teachersCount === 115) {
                    for (let teacher of allHTMLTeachers) {
                        let html = HTMLParser.parse(teacher);
                        let teachers = html.querySelectorAll(".list-group-item > a");
                        for (let teacher of teachers) {
                            const id = teacher.getAttribute("href").replace(/\D/g, '');
                            result.teachers.push({ name: teacher.innerText, link: `/rasp?staffId=${id}` });
                        }
                    }
                    fs.writeFileSync("GroupsAndTeachers.json", JSON.stringify(result));
                }
            }
        }
    }
}


