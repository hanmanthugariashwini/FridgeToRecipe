import { useEffect, useRef, useState } from "react";

const examples = [
  "chicken, onion, tomato, garlic, rice, salt, oil",
  "potato, eggs, onion, tomato, green chili, salt, oil",
  "paneer, capsicum, onion, tomato, garlic, spices"
];

export default function App() {
  const [ingredients, setIngredients] = useState("");
  const [recipe, setRecipe] = useState(null);
  const [servings, setServings] = useState(2);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestId = useRef(0);
  const controller = useRef(null);

  useEffect(() => {
    return () => controller.current?.abort();
  }, []);

  async function createRecipe(event) {
    event?.preventDefault();

    const value = ingredients.trim();

    if (!value) {
      setError("Please enter some ingredients first.");
      return;
    }

    controller.current?.abort();
    controller.current = new AbortController();

    const id = ++requestId.current;

    setLoading(true);
    setError("");
    setRecipe(null);
    setCompleted([]);

    try { const response = await fetch(
  "https://fridgetorecipe.onrender.com/api/recipe",
  {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ingredients: value
        }),
        signal: controller.current.signal
      });

      const data = await response.json().catch(() => ({}));

      if (id !== requestId.current) return;

      if (!response.ok) {
        throw new Error(data.error || "Recipe generation failed.");
      }

      // Backend returns the recipe directly.
      if (!data || !data.title) {
        throw new Error("The server returned an empty recipe.");
      }

      // Convert backend format into the format used by the UI.
      const formattedRecipe = {
        title: data.title,
        description: data.description,
        servings: Number(data.servings) || 2,

        ingredients: Array.isArray(data.ingredients)
          ? data.ingredients.map((item) => ({
              name: item.name || "Ingredient",
              amount: item.amount || "as needed"
            }))
          : [],

        steps: Array.isArray(data.steps)
          ? data.steps.map((step, index) => ({
              id: index + 1,
              instruction: String(step)
            }))
          : [],

        swaps: Array.isArray(data.swaps)
          ? data.swaps.map((swap) => ({
              text: String(swap)
            }))
          : [],

        kitchenTip:
          data.kitchenTip ||
          "Taste as you cook and adjust the seasoning to your preference."
      };

      if (
        !formattedRecipe.title ||
        formattedRecipe.ingredients.length === 0 ||
        formattedRecipe.steps.length === 0
      ) {
        throw new Error("The server returned an incomplete recipe.");
      }

      setRecipe(formattedRecipe);
      setServings(formattedRecipe.servings);

    } catch (err) {
      if (
        err.name !== "AbortError" &&
        id === requestId.current
      ) {
        setError(
          err.message ||
          "Something went wrong while creating the recipe."
        );
      }
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }

  function toggleStep(id) {
    setCompleted((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  const progress = recipe
    ? Math.round(
        (completed.length / recipe.steps.length) * 100
      )
    : 0;

  return (
    <div className="app">

      <header className="header">
        <div className="logo">
          🥕 Fridge<span>→</span>Recipe
        </div>

        <div className="badge">
          AI Kitchen Helper
        </div>
      </header>

      <main className="container">

        <section className="hero">

          <div className="hero-copy">

            <p className="eyebrow">
              TURN WHAT YOU HAVE INTO DINNER
            </p>

            <h1>
              What's in your fridge?
            </h1>

            <p className="lead">
              List your ingredients and get a practical
              recipe with checkable steps, scalable
              servings, and easy swaps.
            </p>

          </div>

          <form
            className="input-card"
            onSubmit={createRecipe}
          >

            <label htmlFor="ingredients">
              Your ingredients
            </label>

            <textarea
              id="ingredients"
              value={ingredients}
              onChange={(e) =>
                setIngredients(e.target.value)
              }
              placeholder="e.g. chicken, tomatoes, onion, garlic, rice..."
              rows="5"
              maxLength="2000"
            />

            <div className="input-footer">

              <span>
                {ingredients.length}/2000
              </span>

              <button
                className="primary"
                disabled={loading}
              >
                {loading
                  ? "Creating..."
                  : "✨ Create recipe"}
              </button>

            </div>

            <div className="examples">

              <span>Try:</span>

              {examples.map((example) => (
                <button
                  type="button"
                  key={example}
                  onClick={() => {
                    setIngredients(example);
                    setError("");
                  }}
                >
                  {example}
                </button>
              ))}

            </div>

          </form>

        </section>

        {loading && (
          <section className="state-card">

            <div className="state-icon">
              🍳
            </div>

            <div>
              <h2>
                Creating your recipe...
              </h2>

              <p>
                AI is generating structured recipe data.
              </p>
            </div>

          </section>
        )}

        {!loading && error && (
          <section className="state-card error">

            <div className="state-icon">
              !
            </div>

            <div>

              <h2>
                We couldn't create that recipe
              </h2>

              <p>
                {error}
              </p>

              <button
                className="retry"
                onClick={() => createRecipe()}
              >
                Try again
              </button>

            </div>

          </section>
        )}

        {!loading && !error && !recipe && (
          <section className="empty">

            <div className="state-icon">
              🥘
            </div>

            <h2>
              Your recipe will appear here
            </h2>

            <p>
              Start with whatever ingredients
              you already have.
            </p>

          </section>
        )}

        {recipe && !loading && (

          <section className="recipe-grid">

            <div>

              <div className="recipe-heading">

                <p className="eyebrow">
                  YOUR GENERATED RECIPE
                </p>

                <h2>
                  {recipe.title}
                </h2>

                <p>
                  {recipe.description}
                </p>

                <div className="meta">

                  <span>
                    🍽 Original: {recipe.servings} servings
                  </span>

                </div>

              </div>

              <section className="card">

                <div className="section-heading">

                  <div>

                    <p className="step-label">
                      STEP 1
                    </p>

                    <h3>
                      Ingredients
                    </h3>

                  </div>

                  <div className="serving-control">

                    <button
                      onClick={() =>
                        setServings((n) =>
                          Math.max(1, n - 1)
                        )
                      }
                    >
                      −
                    </button>

                    <strong>
                      {servings}
                    </strong>

                    <button
                      onClick={() =>
                        setServings((n) =>
                          Math.min(20, n + 1)
                        )
                      }
                    >
                      +
                    </button>

                    <span>
                      servings
                    </span>

                  </div>

                </div>

                {recipe.ingredients.map(
                  (item, index) => (
                    <div
                      className="ingredient"
                      key={`${item.name}-${index}`}
                    >

                      <span className="dot" />

                      <span>
                        {item.name}
                      </span>

                      <strong>
                        {item.amount}
                      </strong>

                    </div>
                  )
                )}

              </section>

              <section className="card">

                <div className="section-heading">

                  <div>

                    <p className="step-label">
                      STEP 2
                    </p>

                    <h3>
                      Cooking steps
                    </h3>

                  </div>

                  <button
                    className="reset"
                    onClick={() =>
                      setCompleted([])
                    }
                  >
                    Reset
                  </button>

                </div>

                <div className="progress-label">

                  <span>
                    {completed.length} of{" "}
                    {recipe.steps.length} completed
                  </span>

                  <strong>
                    {progress}%
                  </strong>

                </div>

                <div className="progress-track">

                  <div
                    style={{
                      width: `${progress}%`
                    }}
                  />

                </div>

                <div className="steps">

                  {recipe.steps.map((step) => {

                    const checked =
                      completed.includes(step.id);

                    return (
                      <button
                        className={`step ${
                          checked ? "checked" : ""
                        }`}
                        key={step.id}
                        onClick={() =>
                          toggleStep(step.id)
                        }
                      >

                        <span className="step-number">
                          {checked
                            ? "✓"
                            : step.id}
                        </span>

                        <span>
                          {step.instruction}
                        </span>

                      </button>
                    );

                  })}

                </div>

                {progress === 100 && (
                  <div className="complete">
                    🎉 Nice work! Your recipe is complete.
                  </div>
                )}

              </section>

            </div>

            <aside>

              <section className="card">

                <p className="step-label">
                  STEP 3
                </p>

                <h3>
                  Ingredient swaps
                </h3>

                <p className="muted">
                  Don't have something?
                  Try one of these alternatives.
                </p>

                <div className="swaps">

                  {recipe.swaps.map(
                    (swap, index) => (
                      <div
                        className="swap"
                        key={index}
                      >
                        <p>
                          🔄 {swap.text}
                        </p>
                      </div>
                    )
                  )}

                </div>

              </section>

              <div className="tip">

                <span>
                  💡
                </span>

                <div>

                  <strong>
                    Kitchen tip
                  </strong>

                  <p>
                    {recipe.kitchenTip}
                  </p>

                </div>

              </div>

            </aside>

          </section>

        )}

      </main>

      <footer>

        <span>
          Fridge → Recipe
        </span>

        <span>
          React + Express + Groq
        </span>

      </footer>

    </div>
  );
}