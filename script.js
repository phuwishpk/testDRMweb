const API_URL = '/api/items';

// Load items on page load
document.addEventListener('DOMContentLoaded', loadItems);

// Form submission
document.getElementById('itemForm').addEventListener('submit', addItem);

// Load all items
async function loadItems() {
  try {
    const response = await fetch(API_URL);
    const items = await response.json();
    displayItems(items);
  } catch (error) {
    console.error('Error loading items:', error);
    document.getElementById('itemsList').innerHTML = 
      '<p class="empty-message">❌ ไม่สามารถโหลดข้อมูลได้</p>';
  }
}

// Display items in the list
function displayItems(items) {
  const itemsList = document.getElementById('itemsList');
  
  if (items.length === 0) {
    itemsList.innerHTML = '<p class="empty-message">📭 ไม่มีรายการใดๆ</p>';
    return;
  }

  itemsList.innerHTML = items.map(item => `
    <div class="item">
      <div class="item-name">${item.name}</div>
      <div class="item-desc">${item.description || 'ไม่มีรายละเอียด'}</div>
      <div class="item-actions">
        <button class="btn-edit" onclick="editItem(${item.id})">✏️ แก้ไข</button>
        <button class="btn-delete" onclick="deleteItem(${item.id})">🗑️ ลบ</button>
      </div>
    </div>
  `).join('');
}

// Add new item
async function addItem(e) {
  e.preventDefault();
  
  const name = document.getElementById('itemName').value;
  const description = document.getElementById('itemDesc').value;

  if (!name.trim()) {
    alert('กรุณากรอกชื่อรายการ');
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, description })
    });

    if (response.ok) {
      document.getElementById('itemForm').reset();
      loadItems();
      alert('✅ เพิ่มรายการสำเร็จ');
    } else {
      alert('❌ เพิ่มรายการไม่สำเร็จ');
    }
  } catch (error) {
    console.error('Error adding item:', error);
    alert('❌ เกิดข้อผิดพลาด');
  }
}

// Delete item
async function deleteItem(id) {
  if (!confirm('คุณแน่ใจว่าต้องการลบรายการนี้?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadItems();
      alert('✅ ลบรายการสำเร็จ');
    } else {
      alert('❌ ลบรายการไม่สำเร็จ');
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    alert('❌ เกิดข้อผิดพลาด');
  }
}

// Edit item (simplified - just showing alert with current values)
async function editItem(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const item = await response.json();

    const newName = prompt('แก้ไขชื่อรายการ:', item.name);
    if (newName === null) return;

    const newDesc = prompt('แก้ไขรายละเอียด:', item.description);
    if (newDesc === null) return;

    const updateResponse = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newName, description: newDesc })
    });

    if (updateResponse.ok) {
      loadItems();
      alert('✅ แก้ไขรายการสำเร็จ');
    } else {
      alert('❌ แก้ไขรายการไม่สำเร็จ');
    }
  } catch (error) {
    console.error('Error editing item:', error);
    alert('❌ เกิดข้อผิดพลาด');
  }
}
