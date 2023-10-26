function openModal() {
  const modal = document.querySelector('.delet-account');

  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.querySelector('.delet-account');

  modal.style.display = 'none';
}

function shareProfile() {
  var notice = document.getElementById("notice");
  notice.style.display = "block";
  notice.style.opacity = "1";

  setTimeout(() => {
    notice.style.opacity = "0";
    setTimeout(() => {
      notice.style.display = "none";
    }, 200);
  }, 700);

  var temp = document.createElement("textArea");
  temp.value = window.location;
  document.body.appendChild(temp);
  temp.select();
  document.execCommand("copy");
  document.body.removeChild(temp);
}