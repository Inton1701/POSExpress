<template>
    <Navbar/>
    <router-view></router-view>
    
</template>
<script>
import Navbar from '/src/components/Admin/Navbar.vue';
import Barcode from './Barcode.vue';

export default{
    components: {
        Navbar,
        Barcode
    },
    
}


</script>