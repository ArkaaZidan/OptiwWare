window.optiwareLogout = function () {
    fetch("/api/logout", { method: "POST", credentials: "same-origin" })
        .catch(function () {})
        .finally(function () { window.location.href = "/"; });
};