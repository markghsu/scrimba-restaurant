// FIREBASE SETUP
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, set, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js'

const firebaseConfig = {
    databaseURL: 'https://realtime-database-scrimb-7ee79-default-rtdb.firebaseio.com/'
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const menuInDB = ref(database,'menu');

const paymentForm = document.getElementById("payment-form");
const myOrder = [];
let menuData = {};
let connectedToDB = false;

onValue(menuInDB,(snapshot) => {
    if (!snapshot.exists()) {
        // MENU NO LONGER EXISTS ON FIREBASE, FALL BACK TO ORIGINAL MENU
        import('./menuData.js').then((module) => {
            connectedToDB = false;
            menuData = module.default;
            render();
        });
    } else {
        connectedToDB = true;
        const menu = Object.values(snapshot.val());
        menuData = menu;
        render();
    }
});

/** BUSINESS LOGIC **/
function addItemToOrder( itemId ) {
    if( !itemId ) return;
    const item = myOrder.find(({id})=>(id === itemId));
    if( item ) {
        item.quantity++;
    } else {
        console.log(itemId);
        console.log(menuData.find(({id})=>(id === itemId)));
        const { price, name, type } = menuData.find(({id})=>(id === itemId)) || {};
        myOrder.unshift({
            name,
            type,
            quantity: 1,
            price,
            id: itemId
        });
    }
    render();
}

function removeItemFromOrder( itemId ) {
    if( !itemId ) return;
    const itemInd = myOrder.findIndex(({id})=>(id === itemId));
    myOrder.splice(itemInd,1);
    render();
}

function totalPrice( order = [], discount = 0 ) {
    const total = order.reduce((tot,{ quantity, price }) => (
        tot += quantity * price
        ),0);
    return total * (1 - discount);
}

function calcDiscount( order = [] ) {
    // RETURNS A PERCENTAGE DISCOUNT OF 20% ON THE ENTIRE ORDER IF IT IS A "MEAL" -
    // IF IT HAS A MAIN, SIDE, AND DRINK IN THE SAME ORDER
    // CURRENTLY THIS IS HARDCODED, COULD ALSO DO A DB LOOKUP FOR DISCOUNTS
    const types = new Set(['main','side','drink']);
    order.forEach(({ type }) => { if(type) types.delete(type) });
    if(types.size === 0) return ({
            name: 'Meal Discount',
            amount: 0.2
        });
    return {};
}

function addMenuItemToDB( item = {} ) {
    // INTERNAL FUNCTION NOT USED IN APP -- ADD MENU ITEMS TO OUR DB.
    const id = push(menuInDB).key;
    item.id = id; // put id into our data
    set(ref(database, `menu/${id}`), item);
}

/** RENDERING **/
function render() {
    const discount = calcDiscount(myOrder);
    document.getElementById('menu-items').innerHTML = getMenuHtml(menuData);
    document.getElementById('order-items').innerHTML = getOrderHtml(myOrder, discount);
    document.getElementById('total-price').textContent = '$' + totalPrice(myOrder, discount.amount).toFixed(2);
    if( myOrder.length === 0 ) {
        document.getElementById("order").classList.add('hidden');
    } else {
        document.getElementById("order").classList.remove('hidden');
        document.getElementById('order-notification').classList.add('hidden');
    }
}

function getMenuHtml( itemList = [] ) {
    return itemList.map(({ name, ingredients, price, id, emoji }) => (`
        <li class="menu-item">
            <div class="menu-item-emoji">${emoji}</div>
            <div class="menu-item-info">
                <h3 class="menu-item-name">${name}</h3>
                <p class="menu-item-ingredients">${ingredients.join(', ')}</p>
                <p class="menu-item-price">$${price.toFixed(2)}</p>
            </div>
            <button class="add-btn" data-menu-item="${id}" aria-label="Add to Order"></button>
        </li>
        `)).join('');
}

function getOrderHtml( order = [], discount = {} ) {
    const html = order.map(({ name, quantity, price, id }) => (`
        <li class="order-item">
            <p class="order-item-name">${name}${(quantity>1?' x'+quantity:'')}</p>
            <button class="order-remove-btn" data-order-item="${id}">Remove</button>
            <p class="order-item-price">$${(price * quantity).toFixed(2)}</p>
        </li>
        `));
    if( discount.amount ) html.push(`
        <li class="order-item order-discount">
            <p class="order-item-name">${discount.name}</p>
            <p class="order-item-price">-${discount.amount * 100}%</p>
        </li>
        `);
    return html.join('');
}

/** EVENT LISTENERS **/
document.getElementById("menu-items").addEventListener('click',(evt) => {
    if(evt.target.dataset.menuItem) {
        addItemToOrder(evt.target.dataset.menuItem);
    }
});

document.getElementById("order-items").addEventListener('click',(evt) => {
    if(evt.target.dataset.orderItem) {
        removeItemFromOrder(evt.target.dataset.orderItem);
    }
});

document.getElementById("complete-order-btn").addEventListener('click',(evt) => {
    document.getElementById('payment-modal').classList.remove('hidden');
});

paymentForm.addEventListener('submit',(evt) => {

    const paymentFormData = new FormData(paymentForm);
    evt.preventDefault();
    const paymentBtn = document.getElementById('payment-btn');
    paymentBtn.textContent = "Processing payment..."
    paymentBtn.disabled = true;

    setTimeout(() => {
        document.getElementById('order-notification-message').textContent = `
            Thanks, ${paymentFormData.get('payment-name')}! Your order is on the way
        `;
        document.getElementById('order-notification').classList.remove('hidden');
        document.getElementById('payment-modal').classList.add('hidden');
        paymentBtn.disabled = false;
        paymentBtn.textContent = 'Pay';
        myOrder.length = 0;
        render();
    },2000)
});