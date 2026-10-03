const addButton =
    document.getElementById("addButton");

const loanDialog =
    document.getElementById("loanDialog");

const closeDialog =
    document.getElementById("closeDialog");

const loanForm =
    document.getElementById("loanForm");

const itemName =
    document.getElementById("itemName");

const personName =
    document.getElementById("personName");

const returnDate =
    document.getElementById("returnDate");

const note =
    document.getElementById("note");

const loanList =
    document.getElementById("loanList");

const searchInput =
    document.getElementById("searchInput");

const filterSelect =
    document.getElementById("filterSelect");

const lentCount =
    document.getElementById("lentCount");

const overdueCount =
    document.getElementById("overdueCount");

const returnedCount =
    document.getElementById("returnedCount");

const toast =
    document.getElementById("toast");


let loans = [];


/* =========================
   LOAD LOANS
========================= */

async function loadLoans() {

    try {

        const response =
            await fetch("/api/loans");

        if (!response.ok) {
            throw new Error(
                "Could not load loans."
            );
        }

        loans = await response.json();

        render();

    } catch (error) {

        console.error(error);

        showToast(
            "Could not load your items."
        );
    }
}


/* =========================
   OPEN DIALOG
========================= */

addButton.addEventListener(
    "click",
    () => {

        loanForm.reset();

        loanDialog.showModal();

        itemName.focus();
    }
);


/* =========================
   CLOSE DIALOG
========================= */

closeDialog.addEventListener(
    "click",
    () => {
        loanDialog.close();
    }
);


/* Close when clicking outside dialog */

loanDialog.addEventListener(
    "click",
    (event) => {

        const rect =
            loanDialog.getBoundingClientRect();

        const clickedOutside =
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom;

        if (clickedOutside) {
            loanDialog.close();
        }
    }
);


/* =========================
   ADD LOAN
========================= */

loanForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const item =
            itemName.value.trim();

        const person =
            personName.value.trim();

        const selectedDate =
            returnDate.value;

        const noteText =
            note.value.trim();


        if (!item || !person) {

            showToast(
                "Please fill in the required fields."
            );

            return;
        }


        try {

            const response =
                await fetch(
                    "/api/loans",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            itemName: item,
                            personName: person,
                            returnDate:
                                selectedDate || null,
                            note: noteText
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Could not save item."
                );
            }


            loans.unshift(data);

            loanDialog.close();

            loanForm.reset();

            render();

            showToast(
                "Item added successfully."
            );

        } catch (error) {

            console.error(error);

            showToast(
                error.message ||
                "Could not save item."
            );
        }
    }
);


/* =========================
   MARK RETURNED
========================= */

async function markReturned(id) {

    try {

        const response =
            await fetch(
                `/api/loans/${id}/return`,
                {
                    method: "PATCH"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not update item."
            );
        }


        loans =
            loans.map(
                (loan) =>
                    loan.id === id
                        ? data
                        : loan
            );


        render();

        showToast(
            "Marked as returned."
        );

    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Could not update item."
        );
    }
}


/* =========================
   DELETE LOAN
========================= */

async function deleteLoan(id) {

    const confirmed =
        window.confirm(
            "Delete this item?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/loans/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Could not delete item."
            );
        }


        loans =
            loans.filter(
                (loan) =>
                    loan.id !== id
            );


        render();

        showToast(
            "Item deleted."
        );

    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Could not delete item."
        );
    }
}


/* =========================
   OVERDUE CHECK
========================= */

function isOverdue(loan) {

    if (
        loan.status === "returned" ||
        !loan.return_date
    ) {
        return false;
    }


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const dueDate =
        new Date(
            `${loan.return_date}T00:00:00`
        );


    return dueDate < today;
}


/* =========================
   DATE FORMAT
========================= */

function formatDate(dateString) {

    if (!dateString) {
        return "No return date";
    }


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================
   RENDER
========================= */

function render() {

    updateStats();


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const filter =
        filterSelect.value;


    let filteredLoans =
        loans.filter(
            (loan) => {

                const matchesSearch =
                    loan.item_name
                        .toLowerCase()
                        .includes(search) ||

                    loan.person_name
                        .toLowerCase()
                        .includes(search) ||

                    (loan.note || "")
                        .toLowerCase()
                        .includes(search);


                if (!matchesSearch) {
                    return false;
                }


                if (filter === "lent") {

                    return (
                        loan.status === "lent"
                    );
                }


                if (filter === "returned") {

                    return (
                        loan.status === "returned"
                    );
                }


                if (filter === "overdue") {

                    return isOverdue(loan);
                }


                return true;
            }
        );


    if (filteredLoans.length === 0) {

        loanList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📦
                </div>

                <h3>
                    Nothing here yet
                </h3>

                <p>
                    Lend something and BorrowBack
                    will remember it for you.
                </p>

            </div>
        `;

        return;
    }


    loanList.innerHTML =
        filteredLoans
            .map(createCard)
            .join("");
}


/* =========================
   CREATE CARD
========================= */

function createCard(loan) {

    const overdue =
        isOverdue(loan);


    let statusClass =
        "lent";

    let statusText =
        "Lent";


    if (loan.status === "returned") {

        statusClass =
            "returned";

        statusText =
            "Returned";

    } else if (overdue) {

        statusClass =
            "overdue";

        statusText =
            "Overdue";
    }


    return `
        <article class="loan-card">

            <div class="loan-top">

                <div>

                    <div class="loan-item">
                        ${escapeHtml(
                            loan.item_name
                        )}
                    </div>

                    <div class="loan-person">
                        With ${escapeHtml(
                            loan.person_name
                        )}
                    </div>

                </div>


                <span
                    class="status ${statusClass}"
                >
                    ${statusText}
                </span>

            </div>


            <div class="loan-details">

                <div>
                    📅 Return:
                    ${formatDate(
                        loan.return_date
                    )}
                </div>

            </div>


            ${
                loan.note
                    ? `
                        <div class="loan-note">
                            ${escapeHtml(
                                loan.note
                            )}
                        </div>
                    `
                    : ""
            }


            <div class="loan-actions">

                ${
                    loan.status === "lent"
                        ? `
                            <button
                                class="action-button return"
                                onclick="markReturned('${loan.id}')"
                            >
                                Mark returned
                            </button>
                        `
                        : ""
                }


                <button
                    class="action-button delete"
                    onclick="deleteLoan('${loan.id}')"
                >
                    Delete
                </button>

            </div>

        </article>
    `;
}


/* =========================
   UPDATE STATS
========================= */

function updateStats() {

    const currentlyLent =
        loans.filter(
            (loan) =>
                loan.status === "lent"
        ).length;


    const overdue =
        loans.filter(
            (loan) =>
                isOverdue(loan)
        ).length;


    const returned =
        loans.filter(
            (loan) =>
                loan.status === "returned"
        ).length;


    lentCount.textContent =
        currentlyLent;

    overdueCount.textContent =
        overdue;

    returnedCount.textContent =
        returned;
}


/* =========================
   SEARCH
========================= */

searchInput.addEventListener(
    "input",
    render
);


/* =========================
   FILTER
========================= */

filterSelect.addEventListener(
    "change",
    render
);


/* =========================
   TOAST
========================= */

let toastTimer;


function showToast(message) {

    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );
}


/* =========================
   HTML ESCAPE
========================= */

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================
   START APP
========================= */

loadLoans();