class MessageSidebar {
    constructor() {
        this.isOpen = false;
        this.createSidebar();
        this.initializeEventListeners();
    }

    createSidebar() {
        // Create sidebar HTML
        const sidebar = document.createElement('div');
        sidebar.className = 'message-sidebar';
        sidebar.innerHTML = `
            <div class="message-sidebar-content">
                <div class="message-header">
                    <h3>Messages</h3>
                    <button class="close-sidebar">×</button>
                </div>
                <div class="message-list"></div>
                <div class="new-message">
                    <button class="new-message-btn">New Message</button>
                </div>
            </div>
            <button class="toggle-sidebar">
                <i class="fas fa-comments"></i>
            </button>
        `;
        document.body.appendChild(sidebar);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .message-sidebar {
                position: fixed;
                right: -300px;
                top: 0;
                height: 100vh;
                width: 300px;
                background: white;
                box-shadow: -2px 0 5px rgba(0,0,0,0.1);
                transition: right 0.3s ease;
                z-index: 1000;
            }

            .message-sidebar.open {
                right: 0;
            }

            .message-sidebar-content {
                height: 100%;
                display: flex;
                flex-direction: column;
                padding: 20px;
            }

            .message-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .close-sidebar {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            }

            .message-list {
                flex-grow: 1;
                overflow-y: auto;
            }

            .new-message {
                padding: 10px 0;
                border-top: 1px solid #eee;
            }

            .new-message-btn {
                width: 100%;
                padding: 10px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }

            .toggle-sidebar {
                position: fixed;
                right: 20px;
                bottom: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: #4CAF50;
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                z-index: 1000;
            }

            .message-item {
                padding: 10px;
                border-bottom: 1px solid #eee;
                cursor: pointer;
            }

            .message-item:hover {
                background: #f5f5f5;
            }

            .message-item.unread {
                background: #e3f2fd;
            }
        `;
        document.head.appendChild(style);
    }

    initializeEventListeners() {
        const sidebar = document.querySelector('.message-sidebar');
        const toggleBtn = document.querySelector('.toggle-sidebar');
        const closeBtn = document.querySelector('.close-sidebar');
        const newMessageBtn = document.querySelector('.new-message-btn');

        toggleBtn.addEventListener('click', () => this.toggleSidebar());
        closeBtn.addEventListener('click', () => this.closeSidebar());
        newMessageBtn.addEventListener('click', () => this.openNewMessageDialog());
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.message-sidebar');
        this.isOpen = !this.isOpen;
        sidebar.classList.toggle('open');
    }

    closeSidebar() {
        const sidebar = document.querySelector('.message-sidebar');
        this.isOpen = false;
        sidebar.classList.remove('open');
    }

    openNewMessageDialog() {
        // Create modal for new message
        const modal = document.createElement('div');
        modal.className = 'message-modal';
        modal.innerHTML = `
            <div class="message-modal-content">
                <h3>New Message</h3>
                <select id="recipient" class="form-select mb-3">
                    <option value="">Select recipient...</option>
                </select>
                <textarea id="message-content" placeholder="Type your message..."></textarea>
                <div class="modal-buttons">
                    <button class="cancel-btn">Cancel</button>
                    <button class="send-btn">Send</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Load users into select
        this.loadUsers();

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .message-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1001;
            }

            .message-modal-content {
                background: white;
                padding: 20px;
                border-radius: 5px;
                width: 90%;
                max-width: 500px;
            }

            .message-modal select,
            .message-modal textarea {
                width: 100%;
                margin: 10px 0;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }

            .message-modal textarea {
                height: 150px;
                resize: vertical;
            }

            .modal-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }

            .modal-buttons button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }

            .cancel-btn {
                background: #f5f5f5;
            }

            .send-btn {
                background: #4CAF50;
                color: white;
            }
        `;
        document.head.appendChild(style);

        // Add event listeners
        const cancelBtn = modal.querySelector('.cancel-btn');
        const sendBtn = modal.querySelector('.send-btn');

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        sendBtn.addEventListener('click', async () => {
            const recipient = modal.querySelector('#recipient').value;
            const content = modal.querySelector('#message-content').value;
            
            if (!recipient) {
                alert('Please select a recipient');
                return;
            }
            
            if (!content.trim()) {
                alert('Please enter a message');
                return;
            }
            
            await this.sendMessage(recipient, content);
            document.body.removeChild(modal);
        });
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users', {
                headers: {
                    'x-access-token': localStorage.getItem('token')
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load users');
            }

            const users = await response.json();
            const select = document.querySelector('#recipient');
            
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.username;
                option.textContent = user.username;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Failed to load users. Please try again.');
        }
    }

    async sendMessage(recipient, content) {
        try {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': localStorage.getItem('token')
                },
                body: JSON.stringify({ recipient, content })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            // Refresh message list
            this.loadMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    }

    async loadMessages() {
        try {
            const response = await fetch('/api/messages', {
                headers: {
                    'x-access-token': localStorage.getItem('token')
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load messages');
            }

            const messages = await response.json();
            this.displayMessages(messages);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    displayMessages(messages) {
        const messageList = document.querySelector('.message-list');
        messageList.innerHTML = messages.map(msg => `
            <div class="message-item ${msg.read ? '' : 'unread'}" data-id="${msg.id}">
                <strong>${msg.sender}</strong>
                <p>${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}</p>
                <small>${new Date(msg.timestamp).toLocaleString()}</small>
            </div>
        `).join('');

        // Add click handlers for messages
        messageList.querySelectorAll('.message-item').forEach(item => {
            item.addEventListener('click', () => this.openMessage(item.dataset.id));
        });
    }

    async openMessage(messageId) {
        // Implementation for opening and displaying a specific message
        // Will be implemented when we add the messaging API
    }
}

// Export the class
export default MessageSidebar;
