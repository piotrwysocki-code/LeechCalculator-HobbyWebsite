const lvlUpExp = [];
const totalexp = [];
const formulaString = "Formula: (((endLvl totalExp - startLvl totalExp)";
let isHourlyRate = true;
let players = JSON.parse(localStorage.getItem("players")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let totalGain = JSON.parse(localStorage.getItem("total-gain")) || 0.00;
let totalLoss = JSON.parse(localStorage.getItem("total-loss")) || 0.00;
const infoUrl =  "https://us-central1-maplelegendscorsproxy.cloudfunctions.net/app/playerdata/";
const oddJobs = ["Beginner", "Islander"];
const warriorJobs = ["Hero", "Dark Knight", "Dragon Knight", "Paladin", "Spearman", "Warrior",
  "Fighter", "Page", "Crusader", "White Knight"
];
const pirateJobs = ["Pirate", "Brawler", "Marauder", "Buccaneer", "Gunslinger",
  "Outlaw", "Corsair"
];
const bowmanJobs = ["Bowman", "Hunter", "Ranger", "Bowmaster", "Crossbowman",
  "Sniper", "Marksman"
];
const thiefJobs = ["Thief", "Assassin", "Bandit", "Hermit", "Chief Bandit", "Night Lord", "Shadower"];
const magicianJobs = ["Bishop", "Archmage (Ice/Lightning)", "Archmage (Fire/Poison)",
  "Cleric", "Priest", "Wizard (Fire/Poison)", "Wizard (Ice/Lightning)",
  "Mage (Fire/Poison)", "Mage (Ice/Lightning)", "Magician"
];

historyRecord = class {
  constructor(id, date, time, playerName, startLvl, startExp, endLvl, endExp, expGained, total, type) {
    this.id = id;
    this.date = date;
    this.time = time;
    this.playerName = playerName;
    this.startLvl = startLvl;
    this.startExp = startExp;
    this.endLvl = endLvl;
    this.endExp = endExp;
    this.expGained = expGained;
    this.total = total;
    this.type = type;
  }
}

Player = class {
  constructor(id, name, date, time, guild, level, job, exp) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.time = time;
    this.guild = guild;
    this.level = level;
    this.job = job;
    this.exp = exp;
  }
}

$(document).ready(function() {
  $.ajax({
    type: "GET",
    url: "exptable.csv",
    dataType: "text",
    success: function(data) {
      showExpTable(data);
    }
  });

  $("#perexp-rate-box").hide();

  $(document).tooltip({
    show: { effect: 'slideDown', delay: 1000, duration: 250 }
  });

  refreshHistory();
  refreshLogs();

  if (players.length == 0) {
    $("#search-ign-input").val("srslyguys");
    $("#search-ign-input-btn").click();
    $("#search-ign-input").val("");
  }

  let input = document.getElementById("search-ign-input");
  input.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById("search-ign-input-btn").click();
    }
  });

  $("#export-history-csv-btn").click(() => {
    let dateObj = new Date();
    let csvContent = "data:text/csv;charset=utf-8,";
    //convert array of objects to JSON stringify
    let temp = JSON.stringify(history);
    csvContent += "id,date,time,ign,startlvl,startexp,endlvl,endexp,expgained,cost,isProfit\n";
    //convert the json string to a csv and add to content
    csvContent += ConvertToCSV(temp);
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    //setting encoded URI
    link.setAttribute("href", encodedUri);
    //setting a customer file name
    link.setAttribute("download",
      `history_${dateObj.getDate()}-${parseInt(dateObj.getMonth()) + 1}-${dateObj.getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  $("#export-explog-csv-btn").click(() => {
    let dateObj = new Date();
    let csvContent = "data:text/csv;charset=utf-8,";
    //convert array of objects to JSON stringify
    let temp = JSON.stringify(players);
    csvContent += "id,name,date,time,guild,level,job,exp\n";
    //convert the json string to a csv and add to content
    csvContent += ConvertToCSV(temp);
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    //setting encoded URI
    link.setAttribute("href", encodedUri);
    //setting a customer file name
    link.setAttribute("download",
      `expLog_${dateObj.getDate()}-${parseInt(dateObj.getMonth()) + 1}-${dateObj.getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  $("#rate-type").click(() => {
    isHourlyRate = !isHourlyRate;
    if (isHourlyRate) {
      $("#perexp-rate-box").toggle("slow");
      $("#hourly-rate-box").toggle("slow");
      if (!$("#startpercent").is(':checked') && !$("#endpercent").is(':checked')) {
        $("#formula").text(`
          ${formulaString} - startExp) + endExp) / eph * price
        `);
      } else if ($("#startpercent").is(':checked') && $("#endpercent").is(':checked')) {
        $("#formula").text(`
          ${formulaString} - expToLvl[startLvl] * (startPct/100)) + expToLvl[endLvl] * (endPct/100)) / eph * price
        `);
      } else if (!$("#startpercent").is(':checked') && $("#endpercent").is(':checked')) {
        $("#formula").text(`
          ${formulaString} - startExp) + expToLvl[endLvl] * (endPct/100)) / eph * price
        `);
      } else {
        $("#formula").text(`
          ${formulaString} - expToLvl[startLvl] * (startPct/100)) + endExp) / eph * price
        `);
      }
    } else {
      $("#hourly-rate-box").toggle("slow");
      $("#perexp-rate-box").toggle("slow");
      if (!$("#startpercent").is(':checked') && !$("#endpercent").is(':checked')) {
        $("#formula").text(`
          ${formulaString} - startExp) + endExp) / rate
        `);
      } else if ($("#startpercent").is(':checked') && $("#endpercent").is(':checked')) {
        $("#formula").text(`
          ${formulaString} - expToLvl[startLvl] * (startPct/100)) + expToLvl[endLvl] * (endPct/100)) / rate
        `);
      } else if (!$("#startpercent").is(':checked') && $("#endpercent").is(':checked')) {
        $("#formula").text(`
          ${formulaString} - startExp) + expToLvl[endLvl] * (endPct/100)) / rate
        `);
      } else {
        $("#formula").text(`
          ${formulaString} - expToLvl[startLvl] * (startPct/100)) + endExp) / rate
        `);
      }
    }
  });

  $("#endpercent").click(() => {
    checkFields();
  });

  $("#startpercent").click(() => {
    checkFields();
  });
});

calculate = () => {
  let startlvl = parseFloat($("#startlvl").val());
  let startexp = $("#startexp").val() ? parseFloat($("#startexp").val()) : 0;
  let endlvl = parseFloat($("#endlvl").val());
  let endexp = $("#endexp").val() ? parseFloat($("#endexp").val()) : 0;
  let totalexpstart = parseFloat(totalexp[startlvl]);
  let totalexpend = parseFloat(totalexp[endlvl]);
  let total = 0;
  let expGained = 0;
  if (startlvl > 0 && startlvl < 201) {
    if (endlvl < 201 && endlvl > 0) {
      if (endlvl >= startlvl) {
        if (isHourlyRate === false) {
          if (parseFloat($("#rate").val()) > 0) {
            let rate = parseFloat($("#rate").val());
            expGained = 0;
            if (startexp !== 0) {
              if ($("#startpercent").is(':checked')) {
                if(startexp >= 0 && startexp < 101){
                  startexp = lvlUpExp[startlvl] * (startexp / 100);
                }else{
                  alert("Please check start percentage, must be a value 0-100");
                  return;
                }
              }
            }
            if ($("#endpercent").is(':checked')) {
              if(endexp >= 0 && endexp < 101){
                endexp = lvlUpExp[endlvl] * (endexp / 100);
              }else{
                alert("Please check finish percentage, must be a value 0-100");
                return;
              }
            }
            expGained = totalexpend - totalexpstart;
            expGained -= startexp;
            expGained += endexp;
            total = expGained / rate;
            $("#total").hide();
            $("#total").html(`${formatNum(total.toFixed(2))}`);
            $("#total-exp").remove();
            $("#outputbox").append(`<p id="total-exp"></p>`);
            $("#total-exp").hide();
            $("#total-exp").html(`Total exp: ${formatNum(expGained.toFixed(2))}`);
            $("#total").show(200, "linear");
            $("#total-exp").show(200, "linear");
            let dateObj = new Date();
            let time = new Date(dateObj.getTime()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            let record = new historyRecord(history.length > 0 ? history.at(-1).id + 1 : 0,
              `${dateObj.getDate()}/${parseInt(dateObj.getMonth()) + 1}/${dateObj.getFullYear()}`, //extract the day/month/year from the date object
              time, $("#player-ign").val() ? $("#player-ign").val() : null, startlvl,
              startexp, endlvl, endexp, expGained, total, $("#trans-type")[0].checked);
            history.push(record);
            localStorage.setItem('history', JSON.stringify(history));
            refreshHistory();
          } else {
            alert("Rate should be greater than 0");
          }
        } else {
          if ($("#eph").val()) {
            if ($("#price").val()) {
              let eph = parseFloat($("#eph").val());
              let price = parseFloat($("#price").val());
              expGained = 0;
              let duration = 0;
              if (startexp !== 0) {
                if ($("#startpercent").is(':checked')) {
                  startexp = lvlUpExp[startlvl] * (startexp / 100);
                }
              }
              if (endexp !== 0) {
                if ($("#endpercent").is(':checked')) {
                  endexp = lvlUpExp[endlvl] * (endexp / 100);
                }
              }
              expGained = totalexpend - totalexpstart;
              expGained -= startexp;
              expGained += endexp;
              duration = expGained / eph;
              total = (expGained / eph) * price;
              $("#total").html(`${formatNum(total.toFixed(2))}`);
              $("#total-exp").remove();
              $("#outputbox").append(`<p id="total-exp"></p>`);
              $("#total-exp").html(`Total exp: ${formatNum(expGained.toFixed(2))}<br>
                  Estimated duration: ${formatNum(duration.toFixed(2))} hrs`);
              let dateObj = new Date();
              let record = new historyRecord(history.length > 0 ? history.at(-1).id + 1 : 0,
                `${dateObj.getDate()}/${parseInt(dateObj.getMonth()) + 1}/${dateObj.getFullYear()}`,
                `${new Date(dateObj.getTime()).toLocaleTimeString().replace(/(.*)\D\d+/, '$1')}`,
                $("#player-ign").val() ? $("#player-ign").val() : null, startlvl,
                startexp, endlvl, endexp, expGained, total, $("#trans-type")[0].checked);
              //$("#player-ign").val("");
              history.push(record);
              localStorage.setItem('history', JSON.stringify(history));
              refreshHistory();
            } else {
              alert("Enter price");
            }
          } else {
            alert("Enter eph");
          }
        }
      } else {
        alert("Missing or invalid level. Start level should be less than or equal to end level.");
      }
    } else {
      alert("Missing or invalid level. Pick a level 1-200.");
    }
  } else {
    alert("Missing or invalid level. Pick a level 1-200.");
  }
}

ConvertToCSV = (objArray) => {
  let array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
  let str = '';
  for (let i = 0; i < array.length; i++) {
    let line = '';
    for (let index in array[i]) {
      if (line != '') line += ','
      line += array[i][index];
    }
    str += line + '\r\n';
  }
  return str;
}

searchIgn = () => {
  let ign = $("#search-ign-input").val();
  $.ajax({
    type: "GET",
    url: `${infoUrl}${ign}`,
    dataType: "JSON",
    beforeSend: function() {
      $("#loading").show(1000);
    },
    success: function(data) {
      let playerData = data;
      if (typeof playerData.name !== 'undefined') {
        $("#success").show("fast");
        let dateObj = new Date();
        let time = new Date(dateObj.getTime()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        let p = new Player(players.length > 0 ? players.at(-1).id + 1 : 0,
          playerData.name, `${dateObj.getDate()}/${parseInt(dateObj.getMonth()) + 1}/${dateObj.getFullYear()}`,
          time, playerData.guild, playerData.level, playerData.job, playerData.exp);
        players.push(p);
        localStorage.setItem("players", JSON.stringify(players));
        refreshLogs();
        setTimeout(() => {
          $("#success").hide("slow");
        }, 2000)
      } else {
        $("#search-ign-input").css('color', 'red');
        $("#search-ign-input").val("Player not found");
        $("#error").show();
        setTimeout(() => {
          $("#error").hide("slow");
          $("#search-ign-input").css('color', 'black');
          $("#search-ign-input").val("");
        }, 2000)
      }
    },
    error: function() {
      $("#loading").hide();
      $("#error").show("fast");
      setTimeout(() => {
        $("#error").hide("slow");
      }, 2000)
    },
    complete: function() {
      $("#loading").hide();
    }
  });
}

showExpTable = (data) => {
  let expTable = []
  let values = "";
  let lvls = [];
  for (i = 0; i < data.length; i++) {
    if (data[i] === "\r" || data[i] === "\n" || data[i] === "") {
      expTable[i] = values;
      values = "";
    } else {
      values += data[i];
    }
  }
  expTable = expTable.filter(function(element) {
    return element !== undefined;
  });
  expTable = expTable.filter(function(entry) {
    return /\S/.test(entry);
  });
  for (i = 0; i < expTable.length; i++) {
    let row = expTable[i].split(',');
    lvls.push(row[0]);
    lvlUpExp.push(row[1]);
    totalexp.push(row[2]);
    let level = formatNum(row[0]);
    let exptolvl = formatNum(row[1]);
    let total = formatNum(row[2]);
    $("#exptable").append(`
      <tr class="exptable-row">
        <td class="exptable-td">${level}</td>
        <td class="exptable-td">${exptolvl}</td>
        <td class="exptable-td">${total}</td>
      </tr>
    `);
  }
}

deleteLog = (item) => {
  let val = $(item).attr('value');
  $(item).parent().parent().parent().hide("slow");
  setTimeout(()=>{
    $(item).parent().parent().parent().remove();
  }, 2000);
  players.forEach(elem => {
    if (elem.id == val) {
      players.splice(players.indexOf(elem), 1);
    }
  });
  if (window.localStorage) {
    localStorage.setItem("players", JSON.stringify(players));
  }
}

deleteRecord = (item) => {
  let val = $(item).attr('value');
  $(item).parent().parent().hide("slow");
  setTimeout(()=>{
    $(item).parent().parent().remove();
  }, 2000);
  history.forEach(elem => {
    if (elem.id == val) {
      history.splice(history.indexOf(elem), 1);
      if (elem.type === true) {
        if(totalGain - elem.total <= 0){
          totalGain = 0;
        }else{
          totalGain -= elem.total;
        }
      } else {
        if(totalLoss - elem.total <= 0){
          totalLoss = 0;
        }else{
          totalLoss -= elem.total;
        }
      }
    }
  });
  $("#total-loss").html(`${formatNum(totalLoss.toFixed(2))}`);
  $("#total-gain").html(`${formatNum(totalGain.toFixed(2))}`);
  if (window.localStorage) {
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("total-loss", JSON.stringify(totalLoss));
    localStorage.setItem("total-gain", JSON.stringify(totalGain));
  }
}

refreshHistory = () => {
  $("#history-record-box").html("");
  totalGain = 0;
  totalLoss = 0;
  if (history.length > 0) {
    history.forEach(item => {
      let date = item.date;
      $("#history-record-box").append(`
        <div class="history-record-item">
          <div class="history-record-info">
              <span class="history-start"> Lvl: ${item.startLvl}</span>, Exp: ${formatNum(item.startExp.toFixed(2))}
              - <span class="history-end">Lvl: ${item.endLvl}</span>, Exp: ${formatNum(item.endExp.toFixed(2))}
              <hr class="history-record-hr">
            <div class="totals">
                <span class="expGained">Total exp: ${formatNum(item.expGained.toFixed(2))}</span>
                <span class="mesosTotal" style="${item.type == true ? "color: green;" : "color: red;"}">
                  <img class="totalMesoImg" src="imgs/meso.png">
                  ${item.type == true ? "+" : "-"} ${formatNum(item.total.toFixed(2))}
                </span>
             </div>
             <hr class="history-record-hr">
             <div class="history-record-footer-info">
               <div class="date-box">
                ${item.date} - ${typeof item.time == 'undefined' ? new Date(date.getTime()).toLocaleTimeString().replace(/(.*)\D\d+/, '$1') : item.time}
               </div>
               <div class="ign-box">
                ${item.playerName !== null ? item.playerName : ""}
               </div>
             </div>
          </div>
          <div class="delete-record-box">
            <button class="delete-record-btn" onclick="deleteRecord(this)" value="${item.id}"><img class="delete-img" src="imgs/delete.png"></button>
          </div>
        </div>
        `);
      if (item.type == true) {
        totalGain += item.total;
      } else {
        totalLoss += item.total;
      }
    });
    $("#total-loss").html(`${formatNum(totalLoss.toFixed(2))}`);
    $("#total-gain").html(`${formatNum(totalGain.toFixed(2))}`);
  }
}

refreshLogs = () => {
  let avatarUrl = "https://maplelegends.com/api/getavatar?name=";
  let jobImg = "https://maplelegends.com/static/images/rank/";
  $("#roster-box-players").html("");
  if (players.length > 0) {
    let arrLen = players.length;
    players.forEach(item => {
      if (item.job === "Islander") {
        jobImg = "https://maplelegends.com/static/images/rank/islander.png";
      } else if (item.job === "Beginner") {
        jobImg = "https://maplelegends.com/static/images/rank/beginner.png";
      } else if (warriorJobs.includes(item.job)) {
        jobImg = "https://maplelegends.com/static/images/rank/warrior.png";
      } else if (pirateJobs.includes(item.job)) {
        jobImg = "https://maplelegends.com/static/images/rank/pirate.png";
      } else if (thiefJobs.includes(item.job)) {
        jobImg = "https://maplelegends.com/static/images/rank/thief.png";
      } else if (magicianJobs.includes(item.job)) {
        jobImg = "https://maplelegends.com/static/images/rank/magician.png";
      } else if (bowmanJobs.includes(item.job)) {
        jobImg = "https://maplelegends.com/static/images/rank/bowman.png";
      } else {
        jobImg = "https://maplelegends.com/static/images/rank/all.png";
      }

      $("#roster-box-players").append(`
        <div class="roster-player">
            <div class="roster-player-avatar-box">
              <img class="roster-player-avatar" src="${avatarUrl}${item.name}">
            </div>
            <table class="roster-player-profile">
              <tr>
                <td class="roster-player-name ">${item.name}</td>
                <td class="roster-player-level">Lv.
                 ${item.level}</td>
              </tr>
                <td class="roster-player-guild">${item.guild}</td>
                <td class="roster-player-job"><div id="roster-player-job-box">${item.job}
                <img id="job-img" src="${jobImg}"></div></td>
              </tr>
              <tr>
                <td class="roster-player-start-time">
                  <span title="${item.date}">
                    ${typeof item.time == 'undefined' ? "N/A" : item.time}
                  </span>
                </td>
                <td class="roster-player-exp"><span class="player-exp-bar">${item.exp}</span></td>
              </tr>
            </table>
            <div class="roster-player-btn-box">
              <div class="roster-player-finalize-btn">
                <button class="finalize-btn" onclick="finalize(${item.id})"><img id="finalize-img" src="imgs/finalize.png"></button>
              </div>
              <div class="roster-player-x-btn">
                <button class="delete-log-btn" onclick="deleteLog(this)" value="${item.id}"><img class="delete-img" src="imgs/delete.png"></button>
              </div>
           </div>
        </div>
        `);
    });

    $(".finalize-btn").attr("title", "Check buyer's current EXP and add data to calculator. Buyer can enter cash shop or change channel to refresh EXP");
  } else {
    $("#roster-box-players").html("");
  }
}

filterTable = () => {
  let input = $("#searchlvl").val();
  let rows = $('.exptable-row').get();
  for (i = 0; i < rows.length; i++) {
    td = rows[i].getElementsByClassName('exptable-td')[0];
    if (input) {
      if (td) {
        value = td.textContent || td.innerText;
        if (value === input || new String(value).valueOf() == new String("Level").valueOf()) {
          $(rows[i]).show();
        } else {
          $(rows[i]).hide();
        }
      }
    } else {
      $(rows[i]).show();
    }
  }
}

finalize = (id) => {
  let player = {};
  players.forEach(elem => {
    if (elem.id == id) {
      player = elem;
      $("#player-id").val(elem.id);
      $("#startlvl").val(elem.level);
      $("#startexp").val(parseFloat(elem.exp.slice(0, -1)));
      if (!$("#startpercent").is(':checked')) {
        $("#startpercent").click();
      }
      $("#player-ign").val(`${elem.name}`);
      $("#startlvl").animate({
        backgroundColor: "#0DD700"
      }, "fast");
      $("#startexp").animate({
        backgroundColor: "#0DD700"
      }, "fast");
      $("#player-ign").animate({
        backgroundColor: "#0DD700"
      }, "fast");

      $("#startlvl").animate({
        backgroundColor: "#FFFFFF"
      }, "fast");
      $("#startexp").animate({
        backgroundColor: "#FFFFFF"
      }, "fast");
      $("#player-ign").animate({
        backgroundColor: "#FFFFFF"
      }, "fast");
    }
  });

  $.ajax({
    type: "GET",
    url: `${infoUrl}${player.name}`,
    dataType: "JSON",
    beforeSend: function() {
      $("#loading-end").show(1000);
    },
    success: function(data) {
      $("#loading-end").hide();
      $("#endlvl").val(data.level);
      $("#endexp").val(parseFloat(data.exp.slice(0, -1)));
      if (!$("#endpercent").is(':checked')) {
        $("#endpercent").click();
      }
      $("#endlvl").animate({
        backgroundColor: "#0DD700"
      }, "fast");

      $("#endexp").animate({
        backgroundColor: "#0DD700"
      }, "fast");

      $("#endlvl").animate({
        backgroundColor: "#FFFFFF"
      }, "fast");

      $("#endexp").animate({
        backgroundColor: "#FFFFFF"
      }, "fast");
    },
    error: function() {
      $("#loading-end").hide();

      $("#endlvl").animate({
        backgroundColor: "#FF0000"
      }, "fast");

      $("#endexp").animate({
        backgroundColor: "#FF0000"
      }, "fast");

      $("#endlvl").animate({
        backgroundColor: "#FFFFFF"
      }, "fast");

      $("#endexp").animate({
        backgroundColor: "#FFFFFF"
      }, "fast");
    }
  });
}

checkFields = () => {
  if ($("#perexp").is(':checked')) {
    if (!$("#startpercent").is(':checked') && !$("#endpercent").is(':checked')) {
      $("#formula").text(`
        ${formulaString} - startExp) + endExp) / rate
      `);
    } else if ($("#startpercent").is(':checked') && $("#endpercent").is(':checked')) {
      $("#formula").text(`
        ${formulaString} - expToLvl[startLvl] * (startPct/100)) + expToLvl[endLvl] * (endPct/100)) / rate
      `);
    } else if (!$("#startpercent").is(':checked') && $("#endpercent").is(':checked')) {
      $("#formula").text(`
        ${formulaString} - startExp) + expToLvl[endLvl] * (endPct/100)) / rate
      `);
    } else {
      $("#formula").text(`
        ${formulaString} - expToLvl[startLvl] * (startPct/100)) + endExp) / rate
      `);
    }
  } else {
    if (!$("#startpercent").is(':checked') && !$("#endpercent").is(':checked')) {
      $("#formula").text(`
        ${formulaString} - startExp) + endExp) / eph * price
      `);
    } else if ($("#startpercent").is(':checked') && $("#endpercent").is(':checked')) {
      $("#formula").text(`
        ${formulaString} - expToLvl[startLvl] * (startPct/100)) + expToLvl[endLvl] * (endPct/100)) / eph * price
      `);
    } else if (!$("#startpercent").is(':checked') && $("#endpercent").is(':checked')) {
      $("#formula").text(`
        ${formulaString} - startExp) + expToLvl[endLvl] * (endPct/100)) / eph * price
      `);
    } else {
      $("#formula").text(`
        ${formulaString} - expToLvl[startLvl] * (startPct/100)) + endExp) / eph * price
      `);
    }
  }
}

clearLogs = () => {
  players = [];
  if (window.localStorage) {
    localStorage.setItem("players", JSON.stringify(players));
  }
  refreshLogs();
}

clearHistory = () => {
  history = [];
  totalLoss = 0;
  totalGain = 0;
  $("#total-loss").html(`${formatNum(totalLoss.toFixed(2))}`);
  $("#total-gain").html(`${formatNum(totalGain.toFixed(2))}`);
  if (window.localStorage) {
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("total-loss", JSON.stringify(totalLoss));
    localStorage.setItem("total-gain", JSON.stringify(totalGain));
  }
  refreshHistory();
}

formatNum = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
