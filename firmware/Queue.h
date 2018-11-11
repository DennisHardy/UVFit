#ifndef __QUEUE_H
#define __QUEUE_H

#include <memory>

template <class T>
class Node {
    private:
        T value;
        std::shared_ptr<Node<T>> prev, next;
    public:
        Node(T item){
            value = item;
            next = nullptr;
            prev = nullptr;
        }
        
        void setNext(std::shared_ptr<Node<T>> newNext){
            next = newNext;
        }
        
        std::shared_ptr<Node<T>> getNext(){
            return next;
        }
        
        void setPrev(std::shared_ptr<Node<T>> newPrev){
            prev = newPrev;
        }
        
        std::shared_ptr<Node<T>> getPrev(){
            return prev;
        }
        
        T getValue(){
            return value;
        }
};

template <class T>
class Queue{
    private:
        std::shared_ptr<Node<T>> head, tail;
    public:
        Queue(){
            head = nullptr;
            tail = nullptr;
        }
        
        bool is_empty(){
            return tail == nullptr;
        }
        
        void enqueue(T item){
            std::shared_ptr<Node<T>> newNode{new Node<T>{item}};
            newNode->setNext(head);
            if(head != nullptr){
                head->setPrev(newNode);
            }
            head = newNode;
            if(tail == nullptr){
                tail = newNode;
            }
        }
        
        T dequeue(){
            std::shared_ptr<Node<T>> old_tail = tail;
            tail = tail->getPrev();
            if(tail == nullptr){
                head = nullptr;
            } else {
                tail->setNext(nullptr);
                old_tail->setPrev(nullptr);
            }
            return old_tail->getValue();
        }
};

#endif