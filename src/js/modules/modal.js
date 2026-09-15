import { swiper } from '../main';

export const modalController = ({modal, btnOpen, btnClose, blockVisible, swiperMain = true, time = 400}) => { 
  const buttonElements = document.querySelectorAll(btnOpen);  
  const modalElem = document.querySelector(modal); 
  const blockHidden = document.querySelector(blockVisible); 

  if (!modalElem) {
    return;
  }
        
  // здесь мы прописываем стили для основного блока модального окна
  modalElem.style.cssText = `  
      display: block;
      visibility: hidden;
      opacity: 0;
      transition: opacity ${time}ms ease-in-out;
  `; /* здесь так как мы используем шаблонную строку мы ставим фигурные скобки с параметром time */
        
  const closeModal = e => {   
    const target = e.target;  
        
    if(target === modalElem || (btnClose && target.closest(btnClose)) || e.code === 'Escape') {  

      modalElem.style.opacity = 0;
      blockHidden.style.opacity = 1;

      if (swiperMain && swiper?.autoplay && !swiper.autoplay.running) {
        swiper.autoplay.start();
      }
      
      setTimeout(() => {  
        modalElem.style.visibility = 'hidden';
        blockHidden.style.visibility = 'visible';
      }, time);
        
      window.removeEventListener('keydown', closeModal); 
    }
  };
        
  const openModal = () => { 
      //  Пока открыта модалка, слайдер на фоне не перелистывается
      if (swiperMain && swiper?.autoplay?.running) {
        swiper.autoplay.stop();
      }
      modalElem.style.visibility = 'visible'; 
      modalElem.style.opacity = 1;   
      blockHidden.style.visibility = 'hidden'; 
      blockHidden.style.opacity = 0;   
      window.addEventListener('keydown', closeModal);
  }; 
        
        
  buttonElements.forEach(btn => { 
      btn.addEventListener('click', openModal); 
  });
        
  modalElem.addEventListener('click', closeModal);
  };
        
 /*  modalController({ 
      modal: '.modal', 
      btnOpen: '.button_modal', 
      btnClose: '.modal_close',
      // time: 1000   
  }); */
        