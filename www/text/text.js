const WORDS_URL = "https://sombra.marinagem.com/bus-view/data/objs/word2images.json";

const validWords = [];
const word2boxes = {};
const word2words = {};

const img2boxes = {};

function fetchJson(url) {
  return fetch(url).then(res => res.json());
}

function createImage(imgId, wordBoxes) {
  const containerEl = document.createElement("div");
  containerEl.classList.add("image-container");

  const imgEl = document.createElement("img");
  imgEl.classList.add("image-image");
  imgEl.src = `../../imgs/${imgId}.jpg`;
  containerEl.appendChild(imgEl);

  const boxOverlayEl = document.createElement("div");
  boxOverlayEl.classList.add("image-boxes");
  containerEl.appendChild(boxOverlayEl);

  wordBoxes.forEach(({ box }) => {
    const boxEl = document.createElement("div");
    boxEl.classList.add("box");
    boxOverlayEl.appendChild(boxEl);
    boxEl.style.left = `${box[0] * 100}%`;
    boxEl.style.top = `${box[1] * 100}%`;
    boxEl.style.width = `${(box[2] - box[0]) * 100}%`;
    boxEl.style.height = `${(box[3] - box[1]) * 100}%`;
  });

  return containerEl;
}

function handleMenuToggle(evt) {
  if (!evt.target.innerHTML) return;
  const toggleEl = evt.target.parentNode.querySelector("input");
  const word = evt.target.innerHTML;

  const imagesBoxes = word2boxes[word];

  imagesBoxes.forEach(imgBox => {
    const imgId = imgBox["image"];
    const box = imgBox["box"];

    if (!toggleEl.checked) {
      img2boxes[imgId] = (img2boxes[imgId] ?? []).concat({ word, box });
    } else {
      img2boxes[imgId] = (img2boxes[imgId] ?? []).filter(wb => wb.word != word);
      if (img2boxes[imgId].length < 1) {
        delete img2boxes[imgId];
      }
    }
  });

  const tableEl = document.getElementById("table");
  tableEl.innerHTML = "";
  Object.keys(img2boxes).forEach(imgId => {
    const imgEl = createImage(imgId, img2boxes[imgId]);
    tableEl.appendChild(imgEl);
  });
}

function createWordButton(word) {
  const wordEl = document.createElement("label");
  wordEl.classList.add("toggle-button");

  const checkEl = document.createElement("input");
  checkEl.setAttribute("type", "checkbox");
  checkEl.classList.add("toggle-input");

  const labelEl = document.createElement("span");
  labelEl.classList.add("toggle-label");
  labelEl.innerHTML = word;
  labelEl.addEventListener("click", handleMenuToggle);

  wordEl.appendChild(checkEl);
  wordEl.appendChild(labelEl);
  return wordEl;
}

function loadMenuWords(words) {
  const menuEl = document.getElementById("menu-words");

  words.forEach(w => {
    const buttEl = createWordButton(w);
    menuEl.appendChild(buttEl);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    fetchJson(WORDS_URL),
  ]).then(data => {
    Object.assign(word2boxes, data[0]["word2box"]);
    Object.assign(word2words, data[0]["word2words"]);
    Object.assign(validWords, data[0]["words"]);

    // Add boxes from alternative spellings to the list of boxes of valid words
    validWords.forEach(word => {
      word2words[word]??[].forEach(altWord => {
        word2boxes[altWord].forEach(imgBox => {
          word2boxes[word].push(imgBox);
        });
      });
    });

    validWords.sort((a, b) => word2boxes[b].length - word2boxes[a].length)
    loadMenuWords(validWords.filter(w => word2boxes[w].length > 2));
  });
});
