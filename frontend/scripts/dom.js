class UserInterface {
    constructor() {
    }

    showModal(title, body) {
        document.getElementById("modalTitle").textContent = title;
        document.getElementById("modalBody").textContent = body;

        const modalElement = document.getElementById("modal");

        const modal = new bootstrap.Modal(modalElement, {
            keyboard: true,
            focus: true
        });

        modal.show();
    }
}

const ui = new UserInterface();