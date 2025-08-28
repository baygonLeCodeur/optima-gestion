"use client";

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { UserList } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminUsersPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Gestion des Utilisateurs et Agents</h1>
        <Card>
          <CardHeader>
            <CardTitle>Liste des Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <UserList />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminUsersPage;
