<template>

        <div class="header">
            <div class="d-flex justify-content-between align-items-center">
                <!-- Logo / Title -->
                <div class="logo">
                    <img src="assets/img/logo.png" alt="POSExpress" class="img-fluid "
                        style="width: 200px; height: 60px;" />
                </div>

                <!-- Logout Button -->
                <button class="btn btn-primary" @click="logout()">LOGOUT</button>
            </div>
        </div>
        <div class="container mt-5">

            <div class="row justify-content-center">
                <div class="col-md-5">
                    <div class="card shadow-lg border-0 rounded">
                        <div class="text-center mt-3">
                            <img src="/img/logo.png" alt="Logo" class="img-fluid "
                                style="width: 400px; height: 100px;" />
                        </div>
                        <div class="card-header text-center  text-white">
                            <h4 class="m-0">Re-Enter The Password</h4>
                        </div>
                        <div class="card-body">
                            <form @submit.prevent="login">
                                <div class="mb-3">
                                    <h5 for="email" class="form-label text-center">{{ email }}</h5>
                                </div>
                                <div class="mb-3 pass-group">
                                    <label for="password" class="form-label">Password</label>
                                    <input :type="isPasswordVisible ? 'text' : 'password'"
                                        class="form-control form-control-lg" id="password" v-model="password"
                                        placeholder="Enter your password" ref="passwordInput" required />
                                    <font-awesome-icon :icon="isPasswordVisible ? 'fa-eye' : 'fa-eye-slash'"
                                        @click="togglePassword()" class="toggle-password fa-xs mt-3"
                                        style="font-size: 8px;" />
                                </div>
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary btn-lg">
                                        Login
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div class="card-footer text-center text-muted">
                            <small>Powered By POSExpress</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
</template>

<label>Password</label>


<script>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import Swal from "sweetalert2";

export default {
    setup() {

        const password = ref("");
        const router = useRouter();
        const isPasswordVisible = ref(false);
        const email = localStorage.getItem("emails");
        const passwordInput = ref(null);
        const togglePassword = () => {
            isPasswordVisible.value = !isPasswordVisible.value;
        }
        const login = async () => {
            try {
                const response = await axios.post("http://localhost:5000/api/login", {
                    email: email,
                    password: password.value,
                });
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("user");
                localStorage.removeItem("id");
                localStorage.removeItem("emails");
                localStorage.removeItem("image");

                const { token, role, user, id, emails,image } = response.data;

                // Store token and role in local storage
                localStorage.setItem("token", token);
                localStorage.setItem("role", role);
                localStorage.setItem("user", user);
                localStorage.setItem("id", id);
                localStorage.setItem("emails", emails);
                localStorage.setItem("image", image);

                // Show success notification
                Swal.fire({
                    icon: "success",
                    title: "Login Successful",
                    timer: 1500, // 
                    showConfirmButton: false

                });

                // Redirect based on role
                if (role === "Admin") {
                    router.push("/dashboard");
                } else if (role === "Cashier") {
                    router.push("/pos");
                }
            } catch (error) {
                // Show error notification
                Swal.fire({
                    icon: "error",
                    title: "Login Failed",
                    text: error.response?.data?.message || "An error occurred during login",
                    timer: 1500, // 
                    showConfirmButton: false
                });


            }
        };
        onMounted(() => {
            if (passwordInput.value) {
                passwordInput.value.focus();
            }
        })

        return {
            email,
            password,
            login,
            togglePassword,
            isPasswordVisible,
            passwordInput
        };
    },
};
</script>