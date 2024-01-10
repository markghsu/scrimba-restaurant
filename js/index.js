import menuData from './menuData.js';

const myOrder = [];
const paymentForm = document.getElementById("payment-form");

function getMenuHtml( itemList = [] ) {
    return itemList.map(({ name, ingredients, price, id, emoji }) => (`
        <li class="menu-item">
            <div class="menu-item-emoji">${emoji}</div>
            <div class="menu-item-info">
                <h3 class="menu-item-name">${name}</h3>
                <p class="menu-item-ingredients">${ingredients.join(', ')}</p>
                <p class="menu-item-price">$${price}</p>
            </div>
            <button class="add-btn" data-menu-item="${id}" aria-label="Add to Order"></button>
        </li>
        `)).join('')
}

function getOrderHtml( order = [] ) {
    return order.map(({ name, quantity, price, id }) => (`
        <li class="order-item">
            <p class="order-item-name">${name}${(quantity>1?' x'+quantity:'')}</p>
            <button class="order-remove-btn" data-order-item="${id}">Remove</button>
            <p class="order-item-price">$${price * quantity}</p>
        </li>
        `)).join('')
}

function totalPrice( order = [] ) {
    return order.reduce((tot,{ quantity, price }) => (
        tot += quantity * price
        ),0);
}


function render() {
    document.getElementById('menu-items').innerHTML = getMenuHtml(menuData);
    document.getElementById('order-items').innerHTML = getOrderHtml(myOrder);
    document.getElementById('total-price').textContent = '$' + totalPrice(myOrder);
    if( myOrder.length === 0 ) {
        document.getElementById("order").classList.add('hidden');
    } else {
        document.getElementById("order").classList.remove('hidden');
        document.getElementById('order-notification').classList.add('hidden');
    }
}

function addItemToOrder(itemId) {
    if( !itemId ) return;
    itemId = Number(itemId);
    const item = myOrder.find(({id})=>(id === itemId));
    if( item ) {
        item.quantity++;
    } else {
        console.log(itemId);
        console.log(menuData.find(({id})=>(id === itemId)));
        const { price, name } = menuData.find(({id})=>(id === itemId)) || {};
        myOrder.unshift({
            name,
            quantity: 1,
            price,
            id: itemId
        });
    }
    render();
}

function removeItemFromOrder(itemId) {
    if( !itemId ) return;
    itemId = Number(itemId);
    const itemInd = myOrder.findIndex(({id})=>(id === itemId));
    myOrder.splice(itemInd,1);
    render();
}

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

render();