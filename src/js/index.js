// Global app controller
import { elements, renderLoader, clearLoader } from './views/base';
import Search from './models/Search';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';

/* Global state of the app
- search object
- current recipe object
- shoping list object
- liked recipes
*/
/**
 * SEARCH CONTROLLER
 */
const state = {};


const controlSearch = async () => {
    //1) get query from view
    const query = searchView.getInput();

    if(query) {
        //2) new search object adn add to state
        state.search = new Search(query);

        //3) prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
        //4) search for recipes
        await state.search.getResults();

        // 5) render results on UI
        clearLoader();
        searchView.renderResults(state.search.result);
        } catch (err) {
            alert('somthing wrong with search...')
            clearLoader();
        } 
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});
//when we click on one of the html elements of the btn
elements.searchResPages.addEventListener('click' ,e => {
    const btn = e.target.closest('.btn-inline');

    if(btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }

});

/**
 * RECIPE CONTROLLER
 */

 /** Get the hash code for the recipe from the URL and send it to UI */
const controlRecipe = async () => {
    //get ID from URL
    const id = window.location.hash.replace('#', '');

    if (id) {
        //prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //highlight in gray selected search
        if(state.search) {
            searchView.highlightSelected(id);
        }
        //create new recipe object
        state.recipe = new Recipe(id);

        try {
            //get recipe data and parse ingredient
            await state.recipe.getRecipe();
            state.recipe.parseIngredient();

            //calc servings
            state.recipe.calcTime();
            state.recipe.calcServings();

            //render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

        } catch (err) {
            alert('Error proccesing recipe');
        }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


/**
 * LIST CONTROLLER
 */
const controlList = () => {
    //create new list if there none yet
    if(!state.list) state.list = new List();
    //add items to list UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

//handle delete and update events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //delete event
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        state.list.deleteItem(id);

        listView.deleteItem(id);
        //count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

/**
 * LIKES CONTROLLER
 */
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    //user has not liked yet
    if (!state.likes.isLiked(currentID)) {
        //add like to state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        //toggle like btn
        likesView.toggleLikeBtn(true);
        //add like to UI
        likesView.renderLike(newLike);
    //user liked recipe
    } else {
        state.likes.deleteLike(currentID);
        likesView.toggleLikeBtn(false);
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//restore liked recipe on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    state.likes.readStorage();
    //toggle btn
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //render likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});


//handling recipe btn clicks

elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        //decrease clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIng(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        //increase clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIng(state.recipe);
    } else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }
});

