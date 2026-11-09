(function (global) {
    "use strict";


    const COUNTRIES = [
        { name: "Indonesia", dial: "62", iso2: "ID", min: 10, max: 13 },
        { name: "Malaysia", dial: "60", iso2: "MY", min: 8, max: 10 },
        { name: "Singapura", dial: "65", iso2: "SG", min: 8, max: 8 },
        { name: "Thailand", dial: "66", iso2: "TH", min: 8, max: 9 },
        { name: "Vietnam", dial: "84", iso2: "VN", min: 9, max: 10 },
        { name: "Filipina", dial: "63", iso2: "PH", min: 10, max: 10 },
        { name: "Brunei", dial: "673", iso2: "BN", min: 7, max: 7 },
        { name: "Kamboja", dial: "855", iso2: "KH", min: 8, max: 9 },
        { name: "Laos", dial: "856", iso2: "LA", min: 8, max: 10 },
        { name: "Myanmar", dial: "95", iso2: "MM", min: 7, max: 10 },
        { name: "Timor Leste", dial: "670", iso2: "TL", min: 7, max: 8 },
        { name: "India", dial: "91", iso2: "IN", min: 10, max: 10 },
        { name: "Pakistan", dial: "92", iso2: "PK", min: 10, max: 10 },
        { name: "Bangladesh", dial: "880", iso2: "BD", min: 10, max: 10 },
        { name: "Sri Lanka", dial: "94", iso2: "LK", min: 9, max: 9 },
        { name: "Nepal", dial: "977", iso2: "NP", min: 10, max: 10 },
        { name: "China", dial: "86", iso2: "CN", min: 11, max: 11 },
        { name: "Hong Kong", dial: "852", iso2: "HK", min: 8, max: 8 },
        { name: "Taiwan", dial: "886", iso2: "TW", min: 9, max: 9 },
        { name: "Jepang", dial: "81", iso2: "JP", min: 9, max: 10 },
        { name: "Korea Selatan", dial: "82", iso2: "KR", min: 9, max: 10 },
        { name: "Arab Saudi", dial: "966", iso2: "SA", min: 9, max: 9 },
        { name: "Uni Emirat Arab", dial: "971", iso2: "AE", min: 9, max: 9 },
        { name: "Qatar", dial: "974", iso2: "QA", min: 8, max: 8 },
        { name: "Kuwait", dial: "965", iso2: "KW", min: 8, max: 8 },
        { name: "Bahrain", dial: "973", iso2: "BH", min: 8, max: 8 },
        { name: "Oman", dial: "968", iso2: "OM", min: 8, max: 8 },
        { name: "Yordania", dial: "962", iso2: "JO", min: 9, max: 9 },
        { name: "Turki", dial: "90", iso2: "TR", min: 10, max: 10 },
        { name: "Israel", dial: "972", iso2: "IL", min: 9, max: 9 },
        { name: "Mesir", dial: "20", iso2: "EG", min: 10, max: 10 },
        { name: "Afrika Selatan", dial: "27", iso2: "ZA", min: 9, max: 9 },
        { name: "Nigeria", dial: "234", iso2: "NG", min: 10, max: 10 },
        { name: "Kenya", dial: "254", iso2: "KE", min: 9, max: 9 },
        { name: "Inggris (UK)", dial: "44", iso2: "GB", min: 10, max: 10 },
        { name: "Irlandia", dial: "353", iso2: "IE", min: 9, max: 9 },
        { name: "Prancis", dial: "33", iso2: "FR", min: 9, max: 9 },
        { name: "Jerman", dial: "49", iso2: "DE", min: 10, max: 11 },
        { name: "Belanda", dial: "31", iso2: "NL", min: 9, max: 9 },
        { name: "Belgia", dial: "32", iso2: "BE", min: 8, max: 9 },
        { name: "Spanyol", dial: "34", iso2: "ES", min: 9, max: 9 },
        { name: "Portugal", dial: "351", iso2: "PT", min: 9, max: 9 },
        { name: "Italia", dial: "39", iso2: "IT", min: 9, max: 10 },
        { name: "Swiss", dial: "41", iso2: "CH", min: 9, max: 9 },
        { name: "Austria", dial: "43", iso2: "AT", min: 10, max: 11 },
        { name: "Swedia", dial: "46", iso2: "SE", min: 9, max: 9 },
        { name: "Norwegia", dial: "47", iso2: "NO", min: 8, max: 8 },
        { name: "Denmark", dial: "45", iso2: "DK", min: 8, max: 8 },
        { name: "Finlandia", dial: "358", iso2: "FI", min: 9, max: 10 },
        { name: "Polandia", dial: "48", iso2: "PL", min: 9, max: 9 },
        { name: "Rusia", dial: "7", iso2: "RU", min: 10, max: 10 },
        { name: "Ukraina", dial: "380", iso2: "UA", min: 9, max: 9 },
        { name: "Yunani", dial: "30", iso2: "GR", min: 10, max: 10 },
        { name: "Amerika Serikat/Kanada", dial: "1", iso2: "US", min: 10, max: 10 },
        { name: "Meksiko", dial: "52", iso2: "MX", min: 10, max: 10 },
        { name: "Brasil", dial: "55", iso2: "BR", min: 10, max: 11 },
        { name: "Argentina", dial: "54", iso2: "AR", min: 10, max: 11 },
        { name: "Chile", dial: "56", iso2: "CL", min: 9, max: 9 },
        { name: "Kolombia", dial: "57", iso2: "CO", min: 10, max: 10 },
        { name: "Peru", dial: "51", iso2: "PE", min: 9, max: 9 },
        { name: "Australia", dial: "61", iso2: "AU", min: 9, max: 9 },
        { name: "Selandia Baru", dial: "64", iso2: "NZ", min: 8, max: 9 }
    ];


    const COUNTRIES_BY_DIAL_LENGTH = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

    const DEFAULT_ISO = "ID";

    function findByIso(iso2) {
        return COUNTRIES.find((c) => c.iso2 === iso2) || COUNTRIES.find((c) => c.iso2 === DEFAULT_ISO);
    }

    function findByDialPrefix(digits) {
        for (const c of COUNTRIES_BY_DIAL_LENGTH) {
            if (digits.startsWith(c.dial)) return c;
        }
        return null;
    }

    function flagEmoji(iso2) {
        if (!iso2 || iso2.length !== 2) return "🌐";
        const base = 0x1f1e6;
        const chars = iso2.toUpperCase().split("").map((ch) => base + (ch.charCodeAt(0) - 65));
        return String.fromCodePoint(...chars);
    }


    function formatGrouped(digits) {
        if (!digits) return "";
        if (digits.length <= 3) return digits;
        let out = digits.slice(0, 3);
        let rest = digits.slice(3);
        while (rest.length > 0) {
            let take = 4;
            // Kalau sisa setelah ambil 4 digit cuma nyisain 1 digit,
            // gabungkan aja ke kelompok ini (jadi 5 digit) daripada
            // bikin kelompok baru isi 1 digit sendirian. Misal 12 digit
            // jadi 857-9589-22011, bukan 857-9589-2201-1.
            if (rest.length - take === 1) {
                take = 5;
            }
            out += "-" + rest.slice(0, take);
            rest = rest.slice(take);
        }
        return out;
    }

    function stripLeadingZeros(digits) {
        return digits.replace(/^0+/, "");
    }

    
    function createPhoneInput(options) {
        const {
            wrapperEl,
            inputEl,
            hintEl,
            defaultIso = DEFAULT_ISO,
            onChange
        } = options;

        let country = findByIso(defaultIso);
        let lastDigits = "";


        const countryBtn = document.createElement("button");
        countryBtn.type = "button";
        countryBtn.className = "country-select-btn";

        const flagSpan = document.createElement("span");
        flagSpan.className = "country-select-flag";
        const dialSpan = document.createElement("span");
        dialSpan.className = "country-select-dial";
        const caretSpan = document.createElement("span");
        caretSpan.className = "country-select-caret";
        caretSpan.textContent = "▾";

        countryBtn.appendChild(flagSpan);
        countryBtn.appendChild(dialSpan);
        countryBtn.appendChild(caretSpan);

        wrapperEl.classList.add("phone-input-wrapper--with-country");
        wrapperEl.insertBefore(countryBtn, wrapperEl.firstChild);

        // ---- Panel dropdown pencarian negara ----
        const panel = document.createElement("div");
        panel.className = "country-dropdown-panel hidden-element";
        panel.style.display = "none";
        panel.innerHTML =
            '<input type="text" class="country-search-input" placeholder="Cari negara atau kode..." autocomplete="off">' +
            '<div class="country-list"></div>';
        document.body.appendChild(panel);

        const searchInput = panel.querySelector(".country-search-input");
        const listEl = panel.querySelector(".country-list");

        function renderList(filter) {
            const q = (filter || "").trim().toLowerCase();
            listEl.innerHTML = "";
            const filtered = COUNTRIES.filter((c) => {
                if (!q) return true;
                return c.name.toLowerCase().includes(q) || c.dial.includes(q.replace("+", ""));
            });
            if (filtered.length === 0) {
                const empty = document.createElement("div");
                empty.className = "country-list-empty";
                empty.textContent = "Negara tidak ditemukan.";
                listEl.appendChild(empty);
                return;
            }
            filtered.forEach((c) => {
                const item = document.createElement("div");
                item.className = "country-item";
                if (c.iso2 === country.iso2) item.classList.add("active");
                item.innerHTML =
                    '<span class="country-item-flag">' + flagEmoji(c.iso2) + "</span>" +
                    '<span class="country-item-name">' + c.name + "</span>" +
                    '<span class="country-item-dial">+' + c.dial + "</span>";
                item.addEventListener("click", () => {
                    setCountry(c.iso2, { refocus: true, keepDigits: true });
                    closePanel();
                });
                listEl.appendChild(item);
            });
        }

        function openPanel() {
            const rect = countryBtn.getBoundingClientRect();
            panel.style.position = "fixed";
            panel.style.left = Math.max(8, rect.left) + "px";
            let top = rect.bottom + 6;
            const estHeight = 320;
            if (top + estHeight > window.innerHeight) {
                top = Math.max(8, rect.top - estHeight - 6);
            }
            panel.style.top = top + "px";
            panel.style.width = Math.max(260, rect.width) + "px";
            panel.classList.remove("hidden-element");
            panel.style.display = "flex";
            searchInput.value = "";
            renderList("");
            setTimeout(() => searchInput.focus(), 30);
            document.addEventListener("mousedown", onDocClick, true);
        }

        function closePanel() {
            panel.classList.add("hidden-element");
            panel.style.display = "none";
            document.removeEventListener("mousedown", onDocClick, true);
        }

        function onDocClick(e) {
            if (!panel.contains(e.target) && e.target !== countryBtn && !countryBtn.contains(e.target)) {
                closePanel();
            }
        }

        countryBtn.addEventListener("click", () => {
            if (panel.classList.contains("hidden-element")) openPanel();
            else closePanel();
        });

        searchInput.addEventListener("input", () => renderList(searchInput.value));


        function refreshCountryUI() {
            flagSpan.textContent = flagEmoji(country.iso2);
            dialSpan.textContent = "+" + country.dial;
            countryBtn.setAttribute("aria-label", "Kode negara: " + country.name + " +" + country.dial);
            if (hintEl) {
                const contoh = formatGrouped("8".repeat(Math.max(country.min, 6)).slice(0, Math.min(country.max, 13)));
                const rangeTxt = country.min === country.max ? country.min + " digit" : country.min + "-" + country.max + " digit";
                hintEl.textContent = "Contoh format: " + contoh + " (" + rangeTxt + ")";
            }
        }

        function setCountry(iso2, opts) {
            const o = opts || {};
            const found = findByIso(iso2);
            if (!found) return;
            country = found;
            refreshCountryUI();
            if (o.keepDigits) {

                applyDigits(lastDigits, { silent: false });
            }
            if (o.refocus) inputEl.focus();
        }


        function applyDigits(digitsRaw, opts) {
            const o = opts || {};
            let digits = stripLeadingZeros((digitsRaw || "").replace(/\D/g, ""));
            if (digits.length > country.max) digits = digits.slice(0, country.max);
            lastDigits = digits;
            inputEl.value = formatGrouped(digits);

            inputEl.dispatchEvent(new Event("phonechange", { bubbles: true }));
            if (!o.silent && typeof onChange === "function") onChange(getController());
        }


        inputEl.addEventListener("input", (e) => {
            const isBackspace = e.inputType === "deleteContentBackward" || e.inputType === "deleteContentForward";
            const hasPlus = /^\s*\+/.test(inputEl.value);

            // Deteksi negara langsung waktu ngetik (bukan cuma waktu paste).
            // Kalau user ngetik pakai tanda "+" (mis. "+855..."), begitu digit
            // yang sudah diketik cocok sama kode dial suatu negara, langsung
            // ganti negara aktif & sisanya diperlakukan sebagai nomor nasional.
            if (hasPlus && !isBackspace) {
                const rawWithPlus = inputEl.value.replace(/\D/g, "");
                const matched = findByDialPrefix(rawWithPlus);
                if (matched) {
                    const national = stripLeadingZeros(rawWithPlus.slice(matched.dial.length));
                    if (matched.iso2 !== country.iso2) {
                        country = matched;
                        refreshCountryUI();
                    }
                    applyDigits(national);
                    return;
                }
            }

            let raw = inputEl.value.replace(/\D/g, "");
            if (isBackspace && raw.length === lastDigits.length && raw.length > 0) {

                raw = raw.slice(0, -1);
            }


            if (!isBackspace && raw.length > lastDigits.length && raw.startsWith(country.dial)) {
                raw = raw.slice(country.dial.length);
            }

            raw = stripLeadingZeros(raw);
            applyDigits(raw);
        });


        inputEl.addEventListener("paste", (e) => {
            const text = (e.clipboardData || window.clipboardData).getData("text");
            if (!text) return;
            e.preventDefault();

            const hasPlus = /^\s*\+/.test(text);
            const digitsAll = text.replace(/\D/g, "");
            if (!digitsAll) return;

            if (hasPlus) {
                const matched = findByDialPrefix(digitsAll);
                if (matched) {
                    const national = digitsAll.slice(matched.dial.length);
                    setCountry(matched.iso2, { refocus: false });
                    applyDigits(national);
                    return;
                }
            }


            if (digitsAll.startsWith(country.dial) && digitsAll.length - country.dial.length >= country.min) {
                applyDigits(digitsAll.slice(country.dial.length));
                return;
            }


            applyDigits(digitsAll);
        });

        function getController() {
            return {
                get country() { return country; },
                get nationalDigits() { return lastDigits; },
                get fullDigits() { return country.dial + lastDigits; }, 
                isValid() { return lastDigits.length >= country.min && lastDigits.length <= country.max; },

                isFull() { return lastDigits.length === country.max; },
                setCountry,
                setFromFullDigits, 
                inputEl,
                countryBtn
            };
        }

   
        function setFromFullDigits(fullDigits) {
            const digits = (fullDigits || "").replace(/\D/g, "");
            if (!digits) {
                refreshCountryUI();
                return;
            }
            const matched = findByDialPrefix(digits) || findByIso(DEFAULT_ISO);
            country = matched;
            refreshCountryUI();
            applyDigits(digits.slice(matched.dial.length), { silent: true });
        }

        refreshCountryUI();

        return getController();
    }

    global.PhoneCountryModule = {
        COUNTRIES,
        flagEmoji,
        formatGrouped,
        findByIso,
        findByDialPrefix,
        createPhoneInput
    };
})(window);
