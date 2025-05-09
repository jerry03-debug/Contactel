/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Global variables
let contacts = [];
let currentContact = null;
let isEditMode = false;

// Variable pour suivre si deviceready a été déclenché
var deviceReadyFired = false;

// Initialisation immédiate pour charger les contacts
$(document).ready(function() {
    console.log('==== Document ready ====');
    
    // Masquer toutes les pages sauf la page d'accueil au démarrage
    $('[data-role=page]').not('#home-page').css('display', 'none');
    $('#home-page').css('display', 'block');
    
    console.log('==== Ajout du gestionnaire deviceready ====');
    // Ajouter un gestionnaire pour l'événement deviceready de Cordova
    document.addEventListener('deviceready', onDeviceReady, false);
    
    // Ajouter un gestionnaire pour l'événement DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('==== DOMContentLoaded ====');
    });
    
    // Vérifier si cordova est défini
    if (typeof cordova !== 'undefined') {
        console.log('==== Cordova est défini dans document.ready ====');
    } else {
        console.log('==== Cordova n\'est PAS défini dans document.ready ====');
    }
    
    // Add event listeners
    addEventListeners();
    
    // Charger des contacts de démonstration par défaut en attendant que Cordova soit prêt
    console.log('==== Chargement des contacts de démonstration par défaut ====');
    loadSampleContacts();
    
    // Essayer de déclencher onDeviceReady après un délai si l'événement deviceready n'est pas déclenché
    setTimeout(function() {
        console.log('==== Vérification si deviceready a été déclenché ====');
        if (typeof cordova !== 'undefined') {
            console.log('==== Cordova est défini après le délai ====');
            if (!deviceReadyFired) {
                console.log('==== deviceready n\'a pas été déclenché, appel manuel de onDeviceReady ====');
                onDeviceReady();
            }
        } else {
            console.log('==== Cordova n\'est toujours PAS défini après le délai ====');
        }
    }, 3000);
});

// Fonction appelée lorsque Cordova est prêt
function onDeviceReady() {
    console.log('==== Cordova is ready ====');
    deviceReadyFired = true;
    
    console.log('navigator', navigator);
    console.log('navigator.contacts', navigator.contacts);
    // Vérifier si le plugin de contacts est disponible
    if (typeof navigator !== 'undefined' && typeof navigator.contacts !== 'undefined') {
        console.log('==== Plugin de contacts disponible ====');
        // Vérifier et demander les permissions pour les contacts
        checkContactsPermission();
    } else {
        console.log('==== Plugin de contacts NON disponible ====');
        if (typeof navigator !== 'undefined') {
            console.log('navigator est défini mais pas navigator.contacts');
            console.log('navigator:', navigator);
        } else {
            console.log('navigator n\'est pas défini');
        }
        // Charger des contacts de démonstration si le plugin n'est pas disponible
        loadSampleContacts();
    }
}

// Fonction pour vérifier et demander les permissions d'accès aux contacts
function checkContactsPermission() {
    console.log('==== Vérification des permissions de contacts ====');
    
    // Vérifier si le plugin de permissions est disponible
    if (typeof cordova !== 'undefined' && 
        typeof cordova.plugins !== 'undefined' && 
        typeof cordova.plugins.permissions !== 'undefined') {
        
        console.log('==== Plugin de permissions disponible ====');
        var permissions = cordova.plugins.permissions;
        
        // Vérifier la permission READ_CONTACTS
        permissions.checkPermission(permissions.READ_CONTACTS, function(status) {
            console.log('==== Statut de la permission READ_CONTACTS ====', status);
            
            if (!status.hasPermission) {
                console.log('==== Demande de permission READ_CONTACTS ====');
                // Demander la permission
                permissions.requestPermission(permissions.READ_CONTACTS, function(status) {
                    console.log('==== Résultat de la demande de permission ====', status);
                    if (status.hasPermission) {
                        console.log('==== Permission accordée, chargement des contacts ====');
                        loadPhoneContacts();
                    } else {
                        console.log('==== Permission refusée, chargement des contacts de démonstration ====');
                        alert("L'accès aux contacts a été refusé. Des contacts de démonstration ont été chargés à la place.");
                        loadSampleContacts();
                    }
                }, function(error) {
                    console.log('==== Erreur lors de la demande de permission ====', error);
                    alert("Impossible de demander l'accès aux contacts. Des contacts de démonstration ont été chargés à la place.");
                    loadSampleContacts();
                });
            } else {
                // Permission déjà accordée
                console.log('==== Permission déjà accordée, chargement des contacts ====');
                loadPhoneContacts();
            }
        }, function(error) {
            console.log('==== Erreur lors de la vérification des permissions ====', error);
            alert("Impossible de vérifier l'accès aux contacts. Des contacts de démonstration ont été chargés à la place.");
            loadSampleContacts();
        });
    } else {
        // Si le plugin de permissions n'est pas disponible, essayer d'accéder directement aux contacts
        console.log('==== Plugin de permissions non disponible, tentative d\'accès direct ====');
        try {
            loadPhoneContacts();
        } catch (error) {
            console.log('==== Erreur lors de l\'accès direct aux contacts ====', error);
            alert("Impossible d'accéder directement aux contacts. Des contacts de démonstration ont été chargés à la place.");
            loadSampleContacts();
        }
    }
}

// Assurer que seule la page active est visible
$(document).on('pagebeforeshow', '[data-role=page]', function() {
    console.log('Page before show:', this.id);
    // S'assurer que seule cette page est visible
    $('[data-role=page]').not(this).hide();
    $(this).show();
});

// Fonction pour changer de page manuellement
function changePage(pageId) {
    console.log('Changing page to:', pageId);
    
    // Masquer toutes les pages
    $('[data-role=page]').hide();
    
    // Afficher la page demandée
    $(pageId).show();
    console.log('Page visibility changed');
    
    // Mettre à jour l'URL sans déclencher d'événement de navigation
    if (history.pushState) {
        history.pushState(null, null, pageId);
    } else {
        window.location.hash = pageId;
    }
    console.log('URL updated');
    
    // Déclencher l'événement pageshow manuellement
    $(document).trigger('pagebeforeshow', { toPage: $(pageId) });
    $(document).trigger('pageshow', { toPage: $(pageId) });
    console.log('Page events triggered');
}

function addEventListeners() {
    // Search functionality
    $('#search-input').on('input', function() {
        filterContacts($(this).val());
    });
    
    // Alphabet index navigation
    $('.alphabet-index li a').on('click', function(e) {
        e.preventDefault();
        const letter = $(this).text();
        navigateToLetter(letter);
    });
    
    // Écouteur pour le bouton "Tous les contacts"
    $(document).on('click', '#show-all-contacts', function() {
        showAllContacts();
    });
    
    // Add contact button
    $('#add-contact-btn').on('click', function() {
        openAddContactForm();
    });
    
    // Delete contact button
    $(document).on('click', '#delete-contact-btn', function() {
        deleteContact(currentContact);
    });
    
    // Save contact button
    $(document).on('click', '#save-contact-btn', function() {
        saveContact();
        return false; // Prevent default action
    });
    
    // Contact item click
    $(document).on('click', '.contact-item', function(e) {
        console.log('Contact item clicked');
        
        // Récupérer la lettre du groupe
        const groupKey = $(this).closest('.contact-group').find('.contact-group-header').text();
        console.log('Group key:', groupKey);
        
        // Utiliser directement l'index du contact dans le groupe
        const contactIndex = $(this).data('index');
        console.log('Contact index in group:', contactIndex);
        
        // Récupérer tous les contacts qui commencent par cette lettre
        const contactsInGroup = contacts.filter(c => {
            const firstLetter = (c.displayName.charAt(0) || '#').toUpperCase();
            return firstLetter === groupKey;
        });
        
        console.log('Contacts in group:', contactsInGroup);
        
        // Récupérer le contact par son index dans le groupe
        const contact = contactsInGroup[contactIndex];
        console.log('Contact found by index:', contact);
        
        if (contact) {
            e.preventDefault(); // Empêcher tout comportement par défaut
            e.stopPropagation(); // Arrêter la propagation de l'événement
            console.log('Opening contact detail...');
            
            // Masquer toutes les pages de manière explicite
            $('[data-role=page]').hide();
            
            // Initialiser les détails du contact
            currentContact = contact;
            $('#contact-initials').text(getInitials(contact));
            $('#contact-name').text(contact.displayName);
            $('#contact-phone').text(contact.phoneNumbers.length > 0 ? contact.phoneNumbers[0].value : 'Aucun numéro');
            $('#contact-email').text(contact.emails.length > 0 ? contact.emails[0].value : 'Aucun email');
            $('#contact-notes').text(contact.note || 'Aucune note');
            
            // Afficher la page de détails
            $('#contact-detail-page').show();
            console.log('Contact detail page shown directly');
        } else {
            console.error('Contact non trouvé pour l\'index:', contactIndex, 'dans le groupe:', groupKey);
        }
        return false; // Empêcher toute autre action par défaut
    });
    
    // Edit contact button - Empêcher le comportement par défaut et utiliser notre fonction
    $(document).on('click', '#edit-contact-btn', function(e) {
        e.preventDefault(); // Empêcher la navigation par défaut
        openEditContactForm(currentContact);
        return false; // Prevent default action
    });
    
    // Close form button
    $(document).on('click', '#close-form-btn', function() {
        // If we were in edit mode, go back to contact detail page
        if (isEditMode && currentContact) {
            setTimeout(function() {
                changePage('#contact-detail-page');
            }, 100);
        } else {
            // Otherwise go back to home page
            setTimeout(function() {
                changePage('#home-page');
            }, 100);
        }
        return false; // Prevent default action
    });
    
    // Bouton de fermeture (croix) dans l'en-tête de la page de détails
    $(document).on('click', '#contact-detail-page .close-btn', function(e) {
        e.preventDefault();
        closeContactDetail();
        return false;
    });
    
    // Tous les liens avec data-rel="back"
    $(document).on('click', '[data-rel="back"]', function(e) {
        e.preventDefault();
        // Déterminer la page d'origine en fonction du contexte
        if ($(this).closest('#contact-detail-page').length) {
            changePage('#home-page');
        } else if ($(this).closest('#contact-form-page').length) {
            if (isEditMode && currentContact) {
                changePage('#contact-detail-page');
            } else {
                changePage('#home-page');
            }
        } else {
            changePage('#home-page');
        }
        return false;
    });
}

// Fonction pour charger les contacts du téléphone avec un délai d'attente
function loadPhoneContacts() {
    console.log('Début de loadPhoneContacts');
    
    // Afficher un message de chargement
    $('#contacts-list').html(`
        <div class="empty-state">
            <p>Chargement des contacts...</p>
        </div>
    `);
    
    // Définir un délai d'attente pour éviter que l'application reste bloquée
    var contactsTimeout = setTimeout(function() {
        console.log("Délai d'attente dépassé pour le chargement des contacts");
        loadSampleContacts();
    }, 3000); // 3 secondes de délai
    
    // Vérifier si le plugin de contacts est disponible
    if (typeof navigator !== 'undefined' && typeof navigator.contacts !== 'undefined') {
        try {
            // Options de recherche pour les contacts
            var options = new ContactFindOptions();
            options.filter = "";  // Rechercher tous les contacts
            options.multiple = true;  // Retourner plusieurs contacts
            
            // Champs à utiliser comme critères de recherche
            var fields = [
                navigator.contacts.fieldType.displayName,
                navigator.contacts.fieldType.name
            ];
            
            // Rechercher tous les contacts
            navigator.contacts.find(fields, 
                function(contacts) {
                    // Annuler le délai d'attente car les contacts ont été trouvés
                    clearTimeout(contactsTimeout);
                    onContactsSuccess(contacts);
                }, 
                function(error) {
                    // Annuler le délai d'attente car une erreur s'est produite
                    clearTimeout(contactsTimeout);
                    console.log("Erreur lors de la recherche des contacts:", error);
                    loadSampleContacts();
                }, 
                options
            );
        } catch (error) {
            // Annuler le délai d'attente car une erreur s'est produite
            clearTimeout(contactsTimeout);
            console.log("Erreur lors de l'accès aux contacts:", error);
            loadSampleContacts();
        }
    } else {
        // Annuler le délai d'attente car le plugin n'est pas disponible
        clearTimeout(contactsTimeout);
        console.log("Plugin de contacts non disponible");
        loadSampleContacts();
    }
}

// Fonction appelée en cas de succès de la recherche de contacts
function onContactsSuccess(phoneContacts) {
    console.log('Contacts found:', phoneContacts.length);
    
    // Si aucun contact n'est trouvé, afficher un message
    if (!phoneContacts || phoneContacts.length === 0) {
        $('#contacts-list').html(`
            <div class="empty-state">
                <p>Aucun contact trouvé.</p>
                <p>Appuyez sur + pour ajouter un contact.</p>
            </div>
        `);
        return;
    }
    
    // Convertir les contacts du téléphone au format de notre application
    contacts = phoneContacts.map(function(contact) {
        // Extraire le prénom et le nom
        let firstName = '';
        let lastName = '';
        
        if (contact.name) {
            firstName = contact.name.givenName || '';
            lastName = contact.name.familyName || '';
        }
        
        // Déterminer le nom d'affichage
        let displayName = contact.displayName;
        if (!displayName) {
            if (firstName || lastName) {
                displayName = (firstName + ' ' + lastName).trim();
            } else if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                displayName = contact.phoneNumbers[0].value;
            } else if (contact.emails && contact.emails.length > 0) {
                displayName = contact.emails[0].value;
            } else {
                displayName = 'Sans nom';
            }
        }
        
        // Créer un objet contact au format de notre application
        return {
            id: contact.id || generateId(),
            firstName: firstName,
            lastName: lastName,
            displayName: displayName,
            phoneNumbers: contact.phoneNumbers || [],
            emails: contact.emails || [],
            note: contact.note || ''
        };
    });
    
    // Trier les contacts par nom
    contacts.sort(function(a, b) {
        return a.displayName.localeCompare(b.displayName, undefined, {sensitivity: 'base'});
    });
    
    // Afficher les contacts
    displayContacts(contacts);
}

// Fonction appelée en cas d'erreur lors de la recherche de contacts
function onContactsError(error) {
    console.error('Error finding contacts:', error);
    
    // En cas d'erreur, charger des contacts de démonstration
    loadSampleContacts();
    
    // Afficher un message d'erreur
    alert("Impossible d'accéder aux contacts du téléphone. Des contacts de démonstration ont été chargés à la place.");
}

function loadSampleContacts() {
    console.log('Début de loadSampleContacts');
    // Use sample data
    contacts = getSampleContacts();
    console.log('Contacts de démonstration chargés:', contacts.length);
    displayContacts(contacts);
    console.log('Fin de loadSampleContacts');
}

function displayContacts(contactsToDisplay) {
    console.log('Displaying contacts:', contactsToDisplay.length);
    console.log('Contact IDs:', contactsToDisplay.map(c => c.id));
    
    if (contactsToDisplay.length === 0) {
        $('#contacts-list').html(`
            <div class="empty-state">
                <p>Aucun contact trouvé.</p>
                <p>Appuyez sur + pour ajouter un contact.</p>
            </div>
        `);
        return;
    }
    
    // Group contacts by first letter of display name
    const groupedContacts = {};
    
    contactsToDisplay.forEach(function(contact) {
        const firstLetter = (contact.displayName.charAt(0) || '#').toUpperCase();
        if (!groupedContacts[firstLetter]) {
            groupedContacts[firstLetter] = [];
        }
        groupedContacts[firstLetter].push(contact);
    });
    
    // Create HTML for contacts list
    let html = '';
    
    // Sort the keys alphabetically
    const sortedKeys = Object.keys(groupedContacts).sort();
    
    sortedKeys.forEach(function(key) {
        html += `
            <div class="contact-group" id="section-${key}">
                <div class="contact-group-header">${key}</div>
        `;
        
        groupedContacts[key].forEach(function(contact) {
            const initials = getInitials(contact);
            const phoneNumber = contact.phoneNumbers.length > 0 ? 
                contact.phoneNumbers[0].value : 
                '';
            
            html += `
                <div class="contact-item" data-id="${contact.id}" data-index="${groupedContacts[key].indexOf(contact)}">
                    <div class="contact-avatar">
                        <div class="avatar-placeholder" style="background-color: ${getRandomColor(contact.id)}">
                            <span>${initials}</span>
                        </div>
                    </div>
                    <div class="contact-details">
                        <div class="contact-name">${contact.displayName}</div>
                        <div class="contact-phone">${phoneNumber}</div>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    $('#contacts-list').html(html);
    console.log('Contacts HTML updated');
}

function filterContacts(query) {
    query = query.toLowerCase();
    
    if (!query) {
        displayContacts(contacts);
        return;
    }
    
    const filteredContacts = contacts.filter(contact => {
        const lastName = (contact.lastName || '').toLowerCase();
        const firstName = (contact.firstName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
        const phoneNumber = (contact.phoneNumbers.length > 0 ? contact.phoneNumbers[0].value : '').toLowerCase();
        
        // Recherche par nom, prénom ou numéro de téléphone
        return fullName.includes(query) || phoneNumber.includes(query);
    });
    
    displayContacts(filteredContacts);
}

// Variable pour suivre le filtre actuel
let currentFilter = null;

function navigateToLetter(letter) {
    // Si c'est le caractère '#', afficher tous les contacts
    if (letter === '#') {
        showAllContacts();
        return true;
    }
    
    // Mettre à jour le filtre actuel
    currentFilter = letter;
    
    // Filtrer les contacts par la lettre sélectionnée
    const filteredContacts = contacts.filter(contact => {
        // Utiliser le prénom pour le filtrage
        const firstName = contact.firstName || '';
        
        // Obtenir la première lettre du prénom
        const firstLetter = firstName.charAt(0).toUpperCase();
        return firstLetter === letter;
    });
    
    // Afficher les contacts filtrés
    displayContacts(filteredContacts);
    
    // Mettre à jour l'interface pour montrer le filtre actif
    updateFilterInterface(letter);
    
    return true;
}

function showAllContacts() {
    // Réinitialiser le filtre
    currentFilter = null;
    
    // Afficher tous les contacts
    displayContacts(contacts);
    
    // Mettre à jour l'interface pour montrer qu'aucun filtre n'est actif
    updateFilterInterface(null);
    
    return true;
}

function updateFilterInterface(letter) {
    // Mettre à jour la classe active sur les lettres
    $('.alphabet-index li a').removeClass('active');
    
    if (letter) {
        $(`.alphabet-index li a[href="#section-${letter}"]`).addClass('active');
        
        // S'assurer que le bouton "Tous" est visible
        if ($('#show-all-contacts').length === 0) {
            // Ajouter le bouton au début de la liste des contacts
            $('.contacts-list').prepend('<div id="show-all-contacts-container"><button id="show-all-contacts" class="show-all-btn">Tous les contacts</button></div>');
        }
    } else {
        // Si aucun filtre, on peut cacher le bouton "Tous"
        $('#show-all-contacts-container').remove();
    }
}

function openContactDetail(contact) {
    console.log('openContactDetail called with contact:', contact);
    currentContact = contact;
    
    // Populate contact details
    $('#contact-initials').text(getInitials(contact));
    $('#contact-name').text(contact.displayName);
    
    $('#contact-phone').text(contact.phoneNumbers.length > 0 ? 
        contact.phoneNumbers[0].value : 
        'Aucun numéro');
    
    $('#contact-email').text(contact.emails.length > 0 ? 
        contact.emails[0].value : 
        'Aucun email');
    
    $('#contact-notes').text(contact.note || 'Aucune note');
    
    console.log('Populated contact details, now changing page...');
    
    // Masquer toutes les pages
    $('[data-role=page]').hide();
    
    // Afficher directement la page de détails
    $('#contact-detail-page').show();
    
    console.log('Changed display of pages directly');
    
    // Puis utiliser la fonction changePage comme backup
    setTimeout(function() {
        console.log('Running changePage after timeout');
        changePage('#contact-detail-page');
    }, 200);
}

function closeContactDetail() {
    currentContact = null;
    changePage('#home-page');
}

function openAddContactForm() {
    isEditMode = false;
    
    // Clear form fields
    $('#form-first-name').val('');
    $('#form-last-name').val('');
    $('#form-phone').val('');
    $('#form-email').val('');
    $('#form-notes').val('');
    $('#form-contact-initials').text('');
    $('#form-header').text('Nouveau contact');
    
    // Navigate to form page
    changePage('#contact-form-page');
}

function openEditContactForm(contact) {
    if (!contact) return;
    
    isEditMode = true;
    
    // Populate form fields
    $('#form-first-name').val(contact.firstName || '');
    $('#form-last-name').val(contact.lastName || '');
    $('#form-phone').val(contact.phoneNumbers.length > 0 ? 
        contact.phoneNumbers[0].value : 
        '');
    $('#form-email').val(contact.emails.length > 0 ? 
        contact.emails[0].value : 
        '');
    $('#form-notes').val(contact.note || '');
    $('#form-contact-initials').text(getInitials(contact));
    $('#form-header').text('Modifier le contact');
    
    // Navigate to form page
    changePage('#contact-form-page');
}

function saveContact() {
    // Get form values
    const firstName = $('#form-first-name').val().trim();
    const lastName = $('#form-last-name').val().trim();
    const phone = $('#form-phone').val().trim();
    const email = $('#form-email').val().trim();
    const notes = $('#form-notes').val().trim();
    
    // Validate form
    if (!firstName && !lastName && !phone && !email) {
        alert('Veuillez saisir au moins un nom, un prénom, un numéro de téléphone ou un email.');
        return;
    }
    
    // Create display name
    const displayName = firstName + (firstName && lastName ? ' ' : '') + lastName;
    
    if (isEditMode && currentContact) {
        // Update existing contact
        currentContact.firstName = firstName;
        currentContact.lastName = lastName;
        currentContact.displayName = displayName || phone || email || 'Sans nom';
        
        // Update phone number
        if (phone) {
            if (currentContact.phoneNumbers.length > 0) {
                currentContact.phoneNumbers[0].value = phone;
            } else {
                currentContact.phoneNumbers.push({
                    type: 'mobile',
                    value: phone
                });
            }
        } else {
            currentContact.phoneNumbers = [];
        }
        
        // Update email
        if (email) {
            if (currentContact.emails.length > 0) {
                currentContact.emails[0].value = email;
            } else {
                currentContact.emails.push({
                    type: 'home',
                    value: email
                });
            }
        } else {
            currentContact.emails = [];
        }
        
        // Update notes
        currentContact.note = notes;
        
        console.log('Contact updated:', currentContact);
        
        // Si nous sommes sur un appareil, mettre à jour le contact dans le téléphone
        if (navigator.contacts) {
            try {
                console.log('Updating contact in phone, contact ID:', currentContact.id);
                
                // Selon la documentation de Cordova, pour mettre à jour un contact existant,
                // il faut d'abord le récupérer, puis le modifier et le sauvegarder
                const options = new ContactFindOptions();
                options.filter = currentContact.id;  // Filtre par ID
                options.multiple = false;  // On ne veut qu'un seul résultat
                
                const fields = [navigator.contacts.fieldType.id];
                
                // Chercher le contact existant
                navigator.contacts.find(fields, function(contacts) {
                    console.log('Find contact success, found contacts:', contacts);
                    
                    if (contacts && contacts.length > 0) {
                        // Contact trouvé, on le met à jour
                        const phoneContact = contacts[0];
                        
                        // Mettre à jour le nom affiché
                        phoneContact.displayName = currentContact.displayName;
                        
                        // Mettre à jour le nom
                        if (!phoneContact.name) {
                            phoneContact.name = new ContactName();
                        }
                        phoneContact.name.givenName = currentContact.firstName;
                        phoneContact.name.familyName = currentContact.lastName;
                        phoneContact.name.formatted = currentContact.displayName;
                        
                        // Mettre à jour les numéros de téléphone
                        if (currentContact.phoneNumbers.length > 0) {
                            phoneContact.phoneNumbers = [];
                            currentContact.phoneNumbers.forEach(function(phone) {
                                phoneContact.phoneNumbers.push(
                                    new ContactField(phone.type, phone.value, phone.type === 'mobile')
                                );
                            });
                        } else {
                            phoneContact.phoneNumbers = [];
                        }
                        
                        // Mettre à jour les emails
                        if (currentContact.emails.length > 0) {
                            phoneContact.emails = [];
                            currentContact.emails.forEach(function(email) {
                                phoneContact.emails.push(
                                    new ContactField(email.type, email.value, email.type === 'home')
                                );
                            });
                        } else {
                            phoneContact.emails = [];
                        }
                        
                        // Mettre à jour la note
                        phoneContact.note = currentContact.note;
                        
                        // Sauvegarder les modifications
                        phoneContact.save(function() {
                            console.log('Contact updated successfully in phone');
                        }, function(error) {
                            console.error('Error saving updated contact:', error);
                            alert('Le contact a été mis à jour dans l\'application, mais pas dans le téléphone.');
                        });
                    } else {
                        console.error('Contact not found in phonebook with ID:', currentContact.id);
                        alert('Le contact n\'a pas été trouvé dans le téléphone.');
                    }
                }, function(error) {
                    console.error('Error finding contact to update:', error);
                    alert('Erreur lors de la recherche du contact dans le téléphone.');
                }, options);
                
            } catch (error) {
                console.error('Error in update contact process:', error);
                alert('Erreur lors de la mise à jour du contact.');
            }
        }
    } else {
        // Create new contact
        const newContact = {
            id: generateId(),
            firstName: firstName,
            lastName: lastName,
            displayName: displayName || phone || email || 'Sans nom',
            phoneNumbers: phone ? [{
                type: 'mobile',
                value: phone
            }] : [],
            emails: email ? [{
                type: 'home',
                value: email
            }] : [],
            note: notes
        };
        
        // Add to contacts array
        contacts.push(newContact);
        console.log('New contact added:', newContact);
        
        // Si nous sommes sur un appareil, ajouter le contact au téléphone
        if (navigator.contacts) {
            try {
                // Créer un objet contact Cordova
                const phoneContact = navigator.contacts.create();
                
                // Définir les propriétés du contact
                phoneContact.displayName = newContact.displayName;
                
                // Définir le nom
                phoneContact.name = new ContactName();
                phoneContact.name.givenName = newContact.firstName;
                phoneContact.name.familyName = newContact.lastName;
                phoneContact.name.formatted = newContact.displayName;
                
                // Définir les numéros de téléphone
                if (newContact.phoneNumbers.length > 0) {
                    phoneContact.phoneNumbers = newContact.phoneNumbers.map(function(phone) {
                        return new ContactField(phone.type, phone.value);
                    });
                }
                
                // Définir les emails
                if (newContact.emails.length > 0) {
                    phoneContact.emails = newContact.emails.map(function(email) {
                        return new ContactField(email.type, email.value);
                    });
                }
                
                // Définir la note
                phoneContact.note = newContact.note;
                
                // Sauvegarder le contact
                phoneContact.save(function(contact) {
                    // Mettre à jour l'ID du contact dans notre application
                    newContact.id = contact.id;
                    console.log('Contact saved to phone with ID:', contact.id);
                }, function(error) {
                    console.error('Error saving contact to phone:', error);
                    alert('Le contact a été ajouté à l\'application, mais pas au téléphone.');
                });
            } catch (error) {
                console.error('Error adding contact to phone:', error);
            }
        }
    }
    
    // Update display
    contacts.sort(function(a, b) {
        return a.displayName.localeCompare(b.displayName, undefined, {sensitivity: 'base'});
    });
    displayContacts(contacts);
    
    // Go back to home page
    changePage('#home-page');
}

function deleteContact(contact) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${contact.displayName} ?`)) {
        // Remove contact from array
        const index = contacts.findIndex(function(c) {
            return c.id === contact.id;
        });
        if (index !== -1) {
            contacts.splice(index, 1);
        }
        
        // Si nous sommes sur un appareil, supprimer le contact du téléphone
        if (navigator.contacts && contact.id) {
            try {
                // Créer un objet contact Cordova avec l'ID du contact à supprimer
                const phoneContact = navigator.contacts.create();
                phoneContact.id = contact.id;
                
                // Supprimer le contact
                phoneContact.remove(function() {
                    console.log('Contact removed from phone');
                }, function(error) {
                    console.error('Error removing contact from phone:', error);
                    alert('Le contact a été supprimé de l\'application, mais pas du téléphone.');
                });
            } catch (error) {
                console.error('Error deleting contact from phone:', error);
            }
        }
        
        displayContacts(contacts);
        
        // Go back to home page
        changePage('#home-page');
    }
}

// Fonction pour gérer le clic sur un contact
function handleContactClick(contactId) {
    console.log('Contact clicked:', contactId);
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
        openContactDetail(contact);
    }
}

// Helper functions
function getInitials(contact) {
    if (!contact) return '';
    
    if (contact.firstName && contact.lastName) {
        return `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase();
    } else if (contact.firstName) {
        return contact.firstName.charAt(0).toUpperCase();
    } else if (contact.lastName) {
        return contact.lastName.charAt(0).toUpperCase();
    } else if (contact.displayName) {
        const parts = contact.displayName.split(' ');
        if (parts.length > 1) {
            return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
        } else {
            return parts[0].charAt(0).toUpperCase();
        }
    }
    
    return '#';
}

function getRandomColor(seed) {
    // Generate a consistent color based on the contact ID
    const colors = [
        '#5ac8fa', // Blue
        '#34c759', // Green
        '#ff9500', // Orange
        '#ff3b30', // Red
        '#af52de', // Purple
        '#ff2d55', // Pink
        '#007aff', // Dark Blue
        '#5856d6'  // Indigo
    ];
    
    // Use the seed to pick a color
    const index = Math.abs(hashCode(seed)) % colors.length;
    return colors[index];
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

// Sample data for testing
function getSampleContacts() {
    return [
        {
            id: generateId(),
            firstName: 'Jean',
            lastName: 'Dupont',
            displayName: 'Jean Dupont',
            phoneNumbers: [{ type: 'mobile', value: '06 12 34 56 78' }],
            emails: [{ type: 'home', value: 'jean.dupont@example.com' }],
            note: 'Ami d\'enfance'
        },
        {
            id: generateId(),
            firstName: 'Marie',
            lastName: 'Martin',
            displayName: 'Marie Martin',
            phoneNumbers: [{ type: 'mobile', value: '06 23 45 67 89' }],
            emails: [{ type: 'work', value: 'marie.martin@company.com' }],
            note: 'Collègue de travail'
        },
        {
            id: generateId(),
            firstName: 'Ahmed',
            lastName: 'Bah',
            displayName: 'Ahmed Bah',
            phoneNumbers: [{ type: 'mobile', value: '06 34 56 78 90' }],
            emails: [{ type: 'home', value: 'ahmed.bah@example.com' }],
            note: ''
        },
        {
            id: generateId(),
            firstName: 'Sophie',
            lastName: 'Petit',
            displayName: 'Sophie Petit',
            phoneNumbers: [{ type: 'mobile', value: '06 45 67 89 01' }],
            emails: [{ type: 'home', value: 'sophie.petit@example.com' }],
            note: 'Voisine'
        },
        {
            id: generateId(),
            firstName: 'Thomas',
            lastName: 'Dubois',
            displayName: 'Thomas Dubois',
            phoneNumbers: [{ type: 'mobile', value: '06 56 78 90 12' }],
            emails: [{ type: 'work', value: 'thomas.dubois@company.com' }],
            note: 'Responsable projet'
        },
        {
            id: generateId(),
            firstName: 'Fatou',
            lastName: 'Diallo',
            displayName: 'Fatou Diallo',
            phoneNumbers: [{ type: 'mobile', value: '06 67 89 01 23' }],
            emails: [{ type: 'home', value: 'fatou.diallo@example.com' }],
            note: 'Amie'
        },
        {
            id: generateId(),
            firstName: 'Pierre',
            lastName: 'Leroy',
            displayName: 'Pierre Leroy',
            phoneNumbers: [{ type: 'mobile', value: '06 78 90 12 34' }],
            emails: [{ type: 'home', value: 'pierre.leroy@example.com' }],
            note: 'Médecin'
        },
        {
            id: generateId(),
            firstName: 'Camille',
            lastName: 'Moreau',
            displayName: 'Camille Moreau',
            phoneNumbers: [{ type: 'mobile', value: '06 89 01 23 45' }],
            emails: [{ type: 'work', value: 'camille.moreau@company.com' }],
            note: 'Collègue'
        },
        {
            id: generateId(),
            firstName: 'Mamadou',
            lastName: 'Sow',
            displayName: 'Mamadou Sow',
            phoneNumbers: [{ type: 'mobile', value: '06 90 12 34 56' }],
            emails: [{ type: 'home', value: 'mamadou.sow@example.com' }],
            note: 'Ami'
        },
        {
            id: generateId(),
            firstName: 'Isabelle',
            lastName: 'Roux',
            displayName: 'Isabelle Roux',
            phoneNumbers: [{ type: 'mobile', value: '06 01 23 45 67' }],
            emails: [{ type: 'home', value: 'isabelle.roux@example.com' }],
            note: 'Professeur'
        }
    ];
}
