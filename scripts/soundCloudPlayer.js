import tracks from "./songLists.js";
let trackNo = Math.floor(Math.random() * tracks.length);

$(document).ready(function () {
  $(".button.bottom, .button.close").on("click", function () {
    $(".player").toggleClass("active");
  });
});

/*EVERYTHING BELOW IS ALL LOGIC FOR SOUNDCLOUD*/

renderSongList();

function renderSongList() {
  let html = "";
  tracks.forEach((track) => {
    html += renderSong(track);
  });

  document.querySelector(".list ul").innerHTML = html;
}

function renderSong({ artist, title, imgSrc, duration }) {
  const dur = duration.split(":");
  const html = `
      <li class="song">
        <img
          src="${imgSrc}"
        />
        <div class="info">
          <h2 class="artist">${artist}</h2>
          <p class="song">${title}</p>
        </div>
        <div class="play">
          <i aria-hidden="true" class="fa fa-play"></i
          ><i aria-hidden="true" class="fa fa-pause"></i>
        </div>
        <p class="duration">${dur[0]}m ${dur[1]}s</p>
      </li>
      `;
  return html;
}

function player(trackNo) {
  this.audioplayer = document.getElementById("player");

  $("#player").attr("src", window.tracks[trackNo].songSrc);

  this.togglePlay = function () {
    $(".play").toggleClass("active");
    if (this.audioplayer.paused) this.play();
    else this.pause();
  };

  this.play = function () {
    $(".play").addClass("active");
    this.audioplayer.play();
    $(".list .song.current").addClass("playing");
  };

  this.pause = function () {
    $(".play").removeClass("active");
    this.audioplayer.pause();
    $(".list .song.current").removeClass("playing");
  };

  this.setSong = function (trackNo) {
    window.currentTrack = trackNo;
    $("#player").attr("src", window.tracks[trackNo].songSrc);
    if ($(".play").hasClass("active")) this.play();
    this.updateList();
  };

  this.nextSong = function () {
    if (window.currentTrack < window.tracks.length - 1) window.currentTrack++;
    var id = window.currentTrack;
    $("#player").attr("src", window.tracks[id].songSrc);
    this.updateList();
    if ($(".play").hasClass("active")) this.play();
  };

  this.prevSong = function () {
    if (window.currentTrack > 0) window.currentTrack--;
    var id = window.currentTrack;
    $("#player").attr("src", window.tracks[id].songSrc);
    this.updateList();
    if ($(".play").hasClass("active")) this.play();
  };

  this.updateList = function () {
    $(".list li.song.current").removeClass("current");
    $(".list li.song").eq(window.currentTrack).addClass("current");
    var track = window.tracks[window.currentTrack];
    if (track.imgSrc !== null)
      $(".controller > .info-content img").attr(
        "src",
        track.imgSrc.replace("large", "t500x500")
      );
    else $(".controller > .info-content img").attr("src", "");
    $(".controller > .info-content .artist").html(track.artist);
    $(".controller > .info-content .song").html(track.title);
    $(".progress-bar > .progress").animate(
      {
        height: "0%",
      },
      1000
    );
  };
}

$(document).ready(function () {
  window.tracks = tracks;
  window.currentTrack = trackNo;
  var Player = new player(window.currentTrack);
  Player.updateList();

  // $(".list .song.current").addClass("playing");

  $(".play").click(function () {
    Player.togglePlay();
  });
  $(".next").click(function () {
    Player.nextSong();
  });
  $(".previous").click(function () {
    Player.prevSong();
  });
  $(".list li.song").click(function () {
    var id = $(this).index();
    Player.setSong(id);
    Player.play();
  });

  $("#player").on("timeupdate", function (event) {
    var progress = (this.currentTime / this.duration) * 100;
    $(".progress-bar > .progress").css({
      height: progress + "%",
    });
  });

  $("#player").bind("ended", function () {
    Player.nextSong();
  });
});
