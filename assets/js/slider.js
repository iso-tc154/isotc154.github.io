(function () {

  const initSlider = () => {
    const hero = document.querySelector('.hero');
    const banners = hero.querySelectorAll('.banner');

    if (banners.length > 0) {
      hero.classList.add('with-flickity');

      const flkt = new Flickity(hero, {
        autoPlay: true,
        wrapAround: true,
      });

      const slideWrappers = hero.querySelectorAll('.banner .wrapper');
      const docStyle = document.documentElement.style;
      const transformProp = typeof docStyle.transform == 'string'
        ? 'transform'
        : 'WebkitTransform';

      flkt.on('scroll', () => {
        flkt.slides.forEach((slide, i) => {
          var _wrapper = slideWrappers[i];
          const x = (slide.target + flkt.x) * -1 / 3;
          _wrapper.style[transformProp] = `translateX(${x}px)`;
        });
      });
    }
  }

  window.setTimeout(initSlider, 400);

}());
