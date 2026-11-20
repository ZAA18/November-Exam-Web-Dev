
/* =========================================
   UNICOMPANION — SHARED NAVIGATION
   Used across all four pages.
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("site-search");

    // Home and View Courses have page-specific live filters. On the other
    // pages, send the search to the university directory instead of allowing
    // the browser to submit the form to the current page and refresh it.
    if (searchForm && !document.getElementById("university-track") && !document.getElementById("university-directory")) {
        searchForm.addEventListener("submit", event => {
            event.preventDefault();
            const destination = new URL("view-courses.html", window.location.href);
            const query = searchInput?.value.trim() || "";
            if (query) destination.searchParams.set("search", query);
            window.location.assign(destination.href);
        });
    }

    const menuToggle = document.getElementById("menu-toggle");

    const navigation = document.getElementById("navigation");

    const navigationLinks = document.querySelectorAll(".nav-link");


    // Stop if navigation elements do not exist

    if (!menuToggle || !navigation) {
        return;
    }


    // Close Navigation Function

    const closeMenu = () => {

        navigation.classList.remove("open");

        menuToggle.setAttribute("aria-expanded", "false");

        menuToggle.setAttribute(
            "aria-label",
            "Open navigation"
        );

    };


    // Open and Close Mobile Menu

    menuToggle.addEventListener("click", () => {

        const isOpen = navigation.classList.toggle("open");

        menuToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );

    });


    // Active Navigation Link

    navigationLinks.forEach(link => {

        link.addEventListener("click", () => {

            navigationLinks.forEach(item => {

                item.classList.remove("active");

            });

            link.classList.add("active");

            closeMenu();

        });

    });


    // Close Navigation With Escape

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            closeMenu();

        }

    });


    // Reset Mobile Navigation When Screen Gets Larger

    window.addEventListener("resize", () => {

        if (window.innerWidth > 900) {

            closeMenu();

        }

    });

});
