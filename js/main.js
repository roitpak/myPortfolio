(function ($) {
  "use strict";

  // loader
  var loader = function () {
    setTimeout(function () {
      if ($("#loader").length > 0) {
        $("#loader").removeClass("show");
      }
    }, 1);
  };
  loader();

  // Initiate the wowjs
  new WOW().init();

  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 200) {
      $(".back-to-top").fadeIn("slow");
    } else {
      $(".back-to-top").fadeOut("slow");
    }
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 1500, "easeInOutExpo");
    return false;
  });

  // Sticky Navbar
  $(window).scroll(function () {
    if ($(this).scrollTop() > 0) {
      $(".navbar").addClass("nav-sticky");
    } else {
      $(".navbar").removeClass("nav-sticky");
    }
  });

  // Smooth scrolling on the navbar links
  $(".navbar-nav a").on("click", function (event) {
    if (this.hash !== "") {
      event.preventDefault();

      $("html, body").animate(
        {
          scrollTop: $(this.hash).offset().top - 45,
        },
        1500,
        "easeInOutExpo"
      );

      if ($(this).parents(".navbar-nav").length) {
        $(".navbar-nav .active").removeClass("active");
        $(this).closest("a").addClass("active");
      }
    }
  });

  // Typed Initiate
  if ($(".hero .hero-text h2").length == 1) {
    var typed_strings = $(".hero .hero-text .typed-text").text();
    var typed = new Typed(".hero .hero-text h2", {
      strings: typed_strings.split(", "),
      typeSpeed: 100,
      backSpeed: 20,
      smartBackspace: false,
      loop: true,
    });
  }

  // Skills
  $(".skills").waypoint(
    function () {
      $(".progress .progress-bar").each(function () {
        $(this).css("width", $(this).attr("aria-valuenow") + "%");
      });
    },
    { offset: "80%" }
  );

  // Testimonials carousel
  $(".testimonials-carousel").owlCarousel({
    center: true,
    autoplay: true,
    dots: true,
    loop: true,
    responsive: {
      0: {
        items: 1,
      },
    },
  });

  // Portfolio filter
  var portfolioIsotope = $(".portfolio-container").isotope({
    itemSelector: ".portfolio-item",
    layoutMode: "fitRows",
  });

  $("#portfolio-filter li").on("click", function () {
    $("#portfolio-filter li").removeClass("filter-active");
    $(this).addClass("filter-active");
    portfolioIsotope.isotope({ filter: $(this).data("filter") });
  });

  // Dynamic Experience Years Calculation
  function updateExperienceYears() {
    var startYear = 2017;
    var currentYear = new Date().getFullYear();
    var experienceYears = currentYear - startYear;

    // Update the experience heading
    $(".about-content .section-header h2").text(
      experienceYears + " Years Experience"
    );

    // Update the about text
    $(".about-text p").text(
      "I have been working as a developer since " +
        experienceYears +
        " years and have acquired many knowledges along the way. Some foremost development skills are,"
    );
  }

  // Call the function when document is ready
  $(document).ready(function () {
    updateExperienceYears();
  });

  // Theme toggle
  var themeToggleBtn = document.getElementById("themeToggle");
  var themeIcon = themeToggleBtn.querySelector("i");
  var currentTheme = localStorage.getItem("theme");

  function setTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      themeIcon.className = "fas fa-sun";
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      themeIcon.className = "fas fa-moon";
      localStorage.setItem("theme", "light");
    }
  }

  if (currentTheme) {
    setTheme(currentTheme);
  } else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    setTheme("dark");
  }

  themeToggleBtn.addEventListener("click", function () {
    var isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "light" : "dark");
  });
})(jQuery);
