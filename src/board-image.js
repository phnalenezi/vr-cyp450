window.BOARD_IMAGE_EDIT = {
  imagePath: './assets/textures/board-info.png',

  // position relative to the board
  position: '1 -1.12 45',

  // rotation relative to the board
  rotation: '90 0 0',

  // size of the PNG on the board
  width: 115,
  height: 78,

  // show / hide
  visible: true,

  // transparency support for PNG
  transparent: true,
  opacity: 1
};

(function () {
  function applyBoardImage() {
    const board = document.getElementById('board');
    if (!board) return;

    let imageEl = document.getElementById('boardPngImage');

    if (!imageEl) {
      imageEl = document.createElement('a-image');
      imageEl.setAttribute('id', 'boardPngImage');
      board.appendChild(imageEl);
    }

    imageEl.setAttribute('src', window.BOARD_IMAGE_EDIT.imagePath);
    imageEl.setAttribute('position', window.BOARD_IMAGE_EDIT.position);
    imageEl.setAttribute('rotation', window.BOARD_IMAGE_EDIT.rotation);
    imageEl.setAttribute('width', window.BOARD_IMAGE_EDIT.width);
    imageEl.setAttribute('height', window.BOARD_IMAGE_EDIT.height);
    imageEl.setAttribute('visible', window.BOARD_IMAGE_EDIT.visible);
    imageEl.setAttribute('material', {
      transparent: window.BOARD_IMAGE_EDIT.transparent,
      opacity: window.BOARD_IMAGE_EDIT.opacity,
      side: 'double'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBoardImage);
  } else {
    applyBoardImage();
  }

  window.addEventListener('load', applyBoardImage);
})();