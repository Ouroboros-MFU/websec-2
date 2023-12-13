let currentUrl = '/rasp?groupId=531873998';
let currentWeek;

fetch('/GroupsAndTeachers')
    .then((data) => data.json())
    .then((res) => {
        let selectElement = document.querySelector("#select-teacher");
        for (let teacher of res.teachers) {
            let teacherElement = document.createElement("option");
            teacherElement.innerHTML = teacher.name;
            teacherElement.setAttribute("value", teacher.link);
            selectElement.appendChild(teacherElement);
        }
        selectElement.addEventListener("change", () => {
            NewData(selectElement.value);
            document.querySelector(".selected").innerHTML = res.teachers.find((a) => a.link === selectElement.value).name;
            selectElement.value = "Преподаватель";
        });

        let searchInput = document.querySelector("#search-teacher");
        searchInput.addEventListener("input", () => {
            if (searchInput.value.trim() === "") {
                // Если строка поиска пуста, восстановить исходное расписание
                NewData(currentUrl);
            }
        });
        let selectElement2 = document.querySelector("#select-group");
        for (let group of res.groups) {
            let groupElement = document.createElement("option");
            groupElement.innerHTML = group.name;
            groupElement.setAttribute("value", group.link);
            selectElement2.appendChild(groupElement);
        }
        selectElement2.addEventListener("change", () => {
            NewData(selectElement2.value);
            document.querySelector(".selected").innerHTML = res.groups.find((a) => a.link === selectElement2.value).name;
            selectElement2.value = "Группа";
        });
        let searchGroup = document.querySelector("#search-group");
        searchGroup.addEventListener("input", () => {
            if (searchInput.value.trim() === "") {
                // Если строка поиска пуста, восстановить исходное расписание
                NewData(currentUrl);
            }
        });
        
    });

function NewData(url) {
    currentUrl = url;
    fetch(url)
        .then((data) => data.json())
        .then((res) => {
            generateSchedule(res);
            console.log(res);
            currentWeek = parseInt(res.currentWeek);
            if (currentWeek === 1) {
                document.querySelector("#previous").style.visibility = "hidden";
            }
        });
}

function generateSchedule(data) {
    let table = document.querySelector("#schedule");
    for (let child of table.childNodes) {
        table.removeChild(child);
    }
    table.insertRow();
    if (data.dates.length === 0) {
        table.querySelector("tr").insertCell().appendChild(document.createTextNode("Расписание отсутствует"));
        return;
    }
    table.querySelector("tr").insertCell().appendChild(document.createTextNode("Время"));

    for (let i = 0; i < data.dates.length; i++) {
        let cell = table.querySelector("tr").insertCell();
        cell.classList.add(`column-${i}`);
        cell.appendChild(document.createTextNode(data.dates[i]));
    }
    let rows = [];
    for (let time of data.leftColumn) {
        let row = table.insertRow();
        rows.push(row);
        row.insertCell().appendChild(document.createTextNode(time));
    }
    for (let i = 0; i < data.leftColumn.length; i++) {
        for (let j = 0; j < 6; j++) {
            if (!data.lessons[j].subject) {
                rows[i].insertCell().classList.add(`column-${j}`);
                continue;
            }
            console.log(i, j);
            let dayData = data.lessons[j];
            let groupsInfo = dayData.groups;
            let Div = document.createElement("div");
            console.log(Div);
            Div.innerHTML = `<div>${dayData.subject}<div>${dayData.place}`;
            let teacherLink = document.createElement("a");
            teacherLink.innerHTML = JSON.parse(dayData.teacher).name;
            teacherLink.addEventListener("click", () => {
                NewData(JSON.parse(dayData.teacher).link);
                document.querySelector(".selected-group").innerHTML = JSON.parse(dayData.teacher).name;
            });
            teacherLink.classList.add("teacher-link");
            Div.appendChild(teacherLink);
            for (let group of groupsInfo) {
                let groupLink = document.createElement("a");
                groupLink.innerHTML = JSON.parse(group).name;
                if (JSON.parse(group).link) {
                    groupLink.addEventListener("click", () => {
                        NewData(JSON.parse(group).link);
                        document.querySelector(".selected-group").innerHTML = JSON.parse(group).name;
                    });
                    groupLink.classList.add("group-link");
                }
                Div.appendChild(groupLink);
            }
            let cell = rows[i].insertCell();
            cell.appendChild(Div);
            cell.classList.add(`column-${j}`);
        }
        console.log(rows[i]);
        data.lessons = data.lessons.slice(6, data.lessons.length);
    }
}

function changeWeek(goNextPage) {
    let index = currentUrl.indexOf("&");
    if (index !== -1) {
        currentUrl = currentUrl.slice(0, index);
    }
    currentUrl += "&selectedWeek=" + (goNextPage ? ++currentWeek : --currentWeek);
    NewData(currentUrl);
}

function searchTeacher() {
    let searchInput = document.querySelector("#search-teacher");
    let searchTerm = searchInput.value.trim().toLowerCase();

    if (searchTerm === "") {
        return; // Не выполняем поиск, если строка пуста
    }

    let selectElement = document.querySelector("#select-teacher");
    let options = selectElement.getElementsByTagName("option");

    for (let option of options) {
        let teacherName = option.innerHTML.toLowerCase();
        if (teacherName.includes(searchTerm)) {
            selectElement.value = option.value;
            NewData(option.value);
            document.querySelector(".selected").innerHTML = option.innerHTML;
            searchInput.value = ""; // Очистить поле поиска после выбора преподавателя
            break;
        }
    }
}

function searchGroup() {
    let searchInput = document.querySelector("#search-group");
    let searchTerm = searchInput.value.trim().toLowerCase();

    if (searchTerm === "") {
        return; // Не выполняем поиск, если строка пуста
    }

    let selectElement = document.querySelector("#select-group");
    let options = selectElement.getElementsByTagName("option");

    for (let option of options) {
        let groupName = option.innerHTML.toLowerCase();
        if (groupName.includes(searchTerm)) {
            selectElement.value = option.value;
            NewData(option.value);
            document.querySelector(".selected").innerHTML = option.innerHTML;
            searchInput.value = ""; // Очистить поле поиска после выбора
            break;
        }
    }
}

NewData(currentUrl);
