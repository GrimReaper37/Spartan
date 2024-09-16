document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("ASrequest");
    const resultDiv = document.getElementById("result");
    const loader = document.getElementById("loader");
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");
    const themeToggle = document.getElementById("themeToggle");
    const signInButton = document.getElementById("signInButton");
    const loginPopup = document.getElementById("loginPopup");
    const signedinPopup = document.getElementById("signedinPopup");
    const discordLoginButton = document.getElementById("DiscordLogin");

    let currentTheme = "normal-mode";
    const themes = ["normal-mode", "light-mode", "dark-mode"];
    const themeIcons = {
        "normal-mode": "fa-n",
        "light-mode": "fa-sun",
        "dark-mode": "fa-moon",
    };

    let rotation = 0;

    const clientId = "1272180390597103626";
    const redirectUri ="https://2a672b1a-c9d9-4fc1-be26-fe74af875ad2-00-2qcmiorg1uww3.riker.replit.dev/auth/callback";
    const scope = "guilds guilds.members.read identify";
    const guildId = "YOUR_GUILD_ID";
    const premiumRoleId = "YOUR_PREMIUM_ROLE_ID";

    function setTheme(theme) {
        document.body.className = theme;
        localStorage.setItem("theme", theme);
        themeToggle.className = `fas ${themeIcons[theme]}`;
        currentTheme = theme;
    }

    themeToggle.addEventListener("click", function () {
        const nextThemeIndex =
            (themes.indexOf(currentTheme) + 1) % themes.length;
        setTheme(themes[nextThemeIndex]);

        // Rotate the icon
        rotation += 359;
        if (rotation >= 360) {
            rotation = 0;
        }
        this.style.transform = `rotate(${rotation}deg)`;
    });

    const savedTheme = localStorage.getItem("theme") || "normal-mode";
    setTheme(savedTheme);

    togglePassword.addEventListener("click", function () {
        const type =
            passwordInput.getAttribute("type") === "password"
                ? "text"
                : "password";
        passwordInput.setAttribute("type", type);
        this.classList.toggle("fa-eye");
        this.classList.toggle("fa-eye-slash");
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        resultDiv.textContent = "";
        loader.classList.remove("hidden");

        const formData = new FormData(form);
        formData.append("expiryDays", "7"); // adjust expiryDays

        const button = form.querySelector('button[type="submit"]');
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing...';
        button.disabled = true;

        fetch("https://f792-54-210-56-162.ngrok-free.app/sign", {
            method: "POST",
            body: formData,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to sign");
                }
                return response.json();
            })
            .then((data) => {
                loader.classList.add("hidden");
                if (data.plistURL) {
                    const installLink = document.createElement("a");
                    installLink.href = `itms-services://?action=download-manifest&url=${data.plistURL}`;
                    installLink.textContent = "Install App";
                    installLink.className = "install-link";
                    resultDiv.appendChild(installLink);
                    showNotification("IPA signed successfully!", "success");
                } else {
                    throw new Error(
                        "Unable to get the install link from api (This means that the api worked but there was an error with getting the install link)",
                    );
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                loader.classList.add("hidden");
                resultDiv.textContent =
                    "Error: Failed to sign. Please contact hiptodude on discord for fixes";
                showNotification(
                    "Error: Failed to sign. Please contact hiptodude on discord for fixes",
                    "error",
                );
            })
            .finally(() => {
                button.innerHTML =
                    '<i class="fas fa-sign-in-alt"></i> Sign IPA';
                button.disabled = false;
            });
    });

    function showNotification(message, type) {
        const notification = document.createElement("div");
        notification.textContent = message;
        notification.className = `notification ${type}`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = "0";
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => {
        input.addEventListener("change", function (event) {
            const file = event.target.files[0];
            if (file && !isValidFileType(file, input.id)) {
                showNotification(
                    `Invalid file type for ${input.id}. Please select the correct file.`,
                    "error",
                );
                input.value = "";
            }
        });
    });

    function isValidFileType(file, inputId) {
        const validTypes = {
            p12: [".p12"],
            mobileprovision: [".mobileprovision"],
            ipa: [".ipa"],
        };
        const fileExtension = file.name.split(".").pop().toLowerCase();
        return validTypes[inputId].includes(`.${fileExtension}`);
    }

    discordLoginButton.addEventListener("click", () => {
        window.location.href = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    });

    window.onload = async function () {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const [accessToken] = [
            fragment.get("access_token"),
            fragment.get("token_type"),
        ];

        if (accessToken) {
            try {
                const userData = await fetchDiscordUserData(accessToken);
                const hasPremiumRole = await checkPremiumRole(
                    accessToken,
                    userData.id,
                );
                displayUserInfo(userData, hasPremiumRole);
                showSignedInPopup(userData.username);
            } catch (error) {
                console.error("Error fetching user data:", error);
                showNotification(
                    "Failed to authenticate with Discord",
                    "error",
                );
            }
        }
    };

    async function fetchDiscordUserData(accessToken) {
        const response = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) throw new Error("Failed to fetch user data");
        return response.json();
    }

    async function checkPremiumRole(accessToken, userId) {
        const response = await fetch(
            `https://discord.com/api/guilds/${guildId}/members/${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );
        if (!response.ok) throw new Error("Failed to fetch guild roles");
        const memberData = await response.json();
        return memberData.roles.includes(premiumRoleId);
    }

    function displayUserInfo(userData, hasPremiumRole) {
        const userInfoDiv = document.createElement("div");
        userInfoDiv.className = "user-info";
        userInfoDiv.innerHTML = `
            <img src="https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=32" alt="${userData.username}'s profile picture" />
            <span>${userData.username}</span>
            ${hasPremiumRole ? '<span class="premium-badge">Premium</span>' : ""}
        `;
        document.querySelector(".nav-container").appendChild(userInfoDiv);
    }

    function showSignedInPopup(username) {
        signedinPopup.querySelector("#username").textContent = username;
        signedinPopup.style.display = "block";
    }

    document.querySelectorAll(".close").forEach((closeButton) => {
        closeButton.addEventListener("click", () => {
            closeButton.closest(".popup").style.display = "none";
        });
    });

    signInButton.addEventListener("click", () => {
        loginPopup.style.display = "block";
    });

    const fileButtons = document.querySelectorAll(".file-button");
    fileButtons.forEach((button) => {
        button.addEventListener("click", () => {
            button.previousElementSibling.click();
        });
    });

    fileInputs.forEach((input) => {
        input.addEventListener("change", (event) => {
            const fileName = event.target.files[0].name;
            const button = input.nextElementSibling;
            button.textContent = fileName;
        });
    });
});
