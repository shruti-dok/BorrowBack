require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const helmet = require("helmet");

const { createClient } = require("@supabase/supabase-js");

const app = express();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    }
);

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

app.use(express.json());
app.use(cookieParser());

/*
    Creates an anonymous identity for each browser.

    No signup.
    No login.
    No username/password.

    The ID is stored in an HttpOnly cookie so
    frontend JavaScript cannot directly modify it.
*/
function ownerMiddleware(req, res, next) {
    let ownerId = req.cookies.owner_id;

    if (!ownerId) {
        ownerId = crypto.randomUUID();

        res.cookie("owner_id", ownerId, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 365
        });
    }

    req.ownerId = ownerId;

    next();
}

app.use(ownerMiddleware);

/*
    Serve frontend files.
*/
app.use(express.static(path.join(__dirname, "../public")));

/*
    GET ALL LOANS
*/
app.get("/api/loans", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("loans")
            .select("*")
            .eq("owner_id", req.ownerId)
            .order("created_at", {
                ascending: false
            });

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: "Could not load your items."
            });
        }

        res.json(data);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Server error."
        });
    }
});

/*
    ADD NEW LOAN
*/
app.post("/api/loans", async (req, res) => {
    try {
        const {
            itemName,
            personName,
            note,
            returnDate
        } = req.body;

        /*
            Validate required fields.
        */
        if (
            typeof itemName !== "string" ||
            typeof personName !== "string"
        ) {
            return res.status(400).json({
                error:
                    "Item name and person's name are required."
            });
        }

        const cleanItem = itemName.trim();
        const cleanPerson = personName.trim();

        const cleanNote =
            typeof note === "string"
                ? note.trim()
                : "";

        /*
            Validate empty fields.
        */
        if (
            cleanItem.length === 0 ||
            cleanPerson.length === 0
        ) {
            return res.status(400).json({
                error:
                    "Item name and person's name are required."
            });
        }

        /*
            Prevent extremely large inputs.
        */
        if (cleanItem.length > 80) {
            return res.status(400).json({
                error: "Item name is too long."
            });
        }

        if (cleanPerson.length > 80) {
            return res.status(400).json({
                error: "Person's name is too long."
            });
        }

        if (cleanNote.length > 200) {
            return res.status(400).json({
                error: "Note is too long."
            });
        }

        /*
            Validate return date if provided.
        */
        let cleanReturnDate = null;

        if (returnDate) {
            if (
                typeof returnDate !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(returnDate)
            ) {
                return res.status(400).json({
                    error: "Invalid return date."
                });
            }

            cleanReturnDate = returnDate;
        }

        /*
            IMPORTANT:

            owner_id comes from req.ownerId,
            NOT from the frontend.

            This is what keeps different users'
            data separated without requiring accounts.
        */
        const { data, error } = await supabase
            .from("loans")
            .insert({
                owner_id: req.ownerId,
                item_name: cleanItem,
                person_name: cleanPerson,
                note: cleanNote || null,
                return_date: cleanReturnDate,
                status: "lent"
            })
            .select()
            .single();

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: "Could not save the item."
            });
        }

        res.status(201).json(data);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Server error."
        });
    }
});

/*
    MARK ITEM AS RETURNED
*/
app.patch("/api/loans/:id/return", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("loans")
            .update({
                status: "returned"
            })
            .eq("id", id)
            .eq("owner_id", req.ownerId)
            .select()
            .single();

        if (error || !data) {
            return res.status(404).json({
                error: "Item not found."
            });
        }

        res.json(data);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Server error."
        });
    }
});

/*
    DELETE ITEM
*/
app.delete("/api/loans/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("loans")
            .delete()
            .eq("id", id)
            .eq("owner_id", req.ownerId)
            .select();

        if (error) {
            console.error(error);

            return res.status(500).json({
                error: "Could not delete item."
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                error: "Item not found."
            });
        }

        res.json({
            success: true
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Server error."
        });
    }
});

/*
    Frontend fallback.

    Express 5 can have problems with app.get("*"),
    so we use app.use() here.
*/
app.use((req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "../public/index.html"
        )
    );
});

/*
    Local development server.
*/
if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(
            `BorrowBack running at http://localhost:${PORT}`
        );
    });
}

module.exports = app;